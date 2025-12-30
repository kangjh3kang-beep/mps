/**
 * ============================================================
 * REDIS-BASED DISTRIBUTED RATE LIMITER
 * Enterprise-Grade Rate Limiting for Multi-Region Deployment
 * ============================================================
 * 
 * Features:
 * - Distributed rate limiting across multiple instances
 * - Sliding window algorithm for accurate limiting
 * - Multiple tier support (API, Auth, Admin, etc.)
 * - Automatic IP blocking after violations
 * - Metrics and monitoring integration
 * 
 * Algorithms:
 * - Token Bucket for burst handling
 * - Sliding Window for accurate rate counting
 * - Fixed Window for simple high-performance limiting
 */

// ============================================
// TYPES
// ============================================

export interface RateLimitConfig {
  /** Maximum requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Block duration after violations (ms) */
  blockDurationMs?: number;
  /** Number of violations before blocking */
  blockThreshold?: number;
  /** Key prefix for Redis */
  keyPrefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** When the limit resets (Unix timestamp ms) */
  resetAt: number;
  /** Whether the client is blocked */
  blocked: boolean;
  /** Retry after (seconds) */
  retryAfter?: number;
  /** Total requests in current window */
  totalRequests: number;
}

export interface RateLimitTier {
  name: string;
  config: RateLimitConfig;
  pathPatterns: RegExp[];
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number; PX?: number; NX?: boolean }): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  zadd(key: string, score: number, member: string): Promise<number>;
  zremrangebyscore(key: string, min: number, max: number): Promise<number>;
  zcount(key: string, min: number, max: number): Promise<number>;
  del(key: string): Promise<number>;
  multi(): RedisMulti;
}

export interface RedisMulti {
  incr(key: string): RedisMulti;
  expire(key: string, seconds: number): RedisMulti;
  ttl(key: string): RedisMulti;
  exec(): Promise<any[]>;
}

// ============================================
// CONFIGURATION
// ============================================

export const DEFAULT_TIERS: RateLimitTier[] = [
  {
    name: 'auth',
    config: {
      limit: 5,
      windowMs: 60000,
      blockDurationMs: 300000, // 5 minutes
      blockThreshold: 3,
      keyPrefix: 'rl:auth',
    },
    pathPatterns: [/^\/api\/auth\//, /^\/auth\//],
  },
  {
    name: 'api',
    config: {
      limit: 100,
      windowMs: 60000,
      blockDurationMs: 60000,
      blockThreshold: 5,
      keyPrefix: 'rl:api',
    },
    pathPatterns: [/^\/api\//],
  },
  {
    name: 'sensitive',
    config: {
      limit: 20,
      windowMs: 60000,
      blockDurationMs: 120000,
      blockThreshold: 3,
      keyPrefix: 'rl:sensitive',
    },
    pathPatterns: [
      /^\/api\/health-records/,
      /^\/api\/measurements/,
      /^\/api\/med-ledger/,
    ],
  },
  {
    name: 'admin',
    config: {
      limit: 50,
      windowMs: 60000,
      blockDurationMs: 60000,
      blockThreshold: 5,
      keyPrefix: 'rl:admin',
    },
    pathPatterns: [/^\/admin\//, /^\/api\/admin\//],
  },
  {
    name: 'global',
    config: {
      limit: 200,
      windowMs: 60000,
      keyPrefix: 'rl:global',
    },
    pathPatterns: [/.*/], // Catch-all
  },
];

// ============================================
// REDIS RATE LIMITER
// ============================================

export class RedisRateLimiter {
  private redis: RedisClient | null = null;
  private tiers: RateLimitTier[];
  private fallbackStore: Map<string, { count: number; resetAt: number }> = new Map();
  private metricsCallback?: (metrics: RateLimitMetrics) => void;

  constructor(
    redisClient?: RedisClient,
    tiers: RateLimitTier[] = DEFAULT_TIERS
  ) {
    this.redis = redisClient || null;
    this.tiers = tiers;
    
    // Cleanup fallback store periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupFallbackStore(), 60000);
    }
  }

  /**
   * Set Redis client (for lazy initialization)
   */
  setRedisClient(client: RedisClient): void {
    this.redis = client;
  }

  /**
   * Set metrics callback for monitoring
   */
  setMetricsCallback(callback: (metrics: RateLimitMetrics) => void): void {
    this.metricsCallback = callback;
  }

  /**
   * Check rate limit for a request
   */
  async checkLimit(
    identifier: string,
    path: string,
    tenantId?: string
  ): Promise<RateLimitResult> {
    const tier = this.getTierForPath(path);
    const key = this.buildKey(tier, identifier, tenantId);
    
    try {
      // Try Redis first
      if (this.redis) {
        return await this.checkRedisLimit(key, tier.config);
      }
      
      // Fallback to in-memory
      return this.checkInMemoryLimit(key, tier.config);
    } catch (error) {
      console.error('[RateLimiter] Redis error, falling back to in-memory:', error);
      return this.checkInMemoryLimit(key, tier.config);
    }
  }

  /**
   * Check if an IP is blocked
   */
  async isBlocked(identifier: string): Promise<boolean> {
    const blockKey = `rl:blocked:${identifier}`;
    
    try {
      if (this.redis) {
        const blocked = await this.redis.get(blockKey);
        return blocked !== null;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Block an IP
   */
  async blockIdentifier(identifier: string, durationMs: number, reason: string): Promise<void> {
    const blockKey = `rl:blocked:${identifier}`;
    const durationSeconds = Math.ceil(durationMs / 1000);
    
    try {
      if (this.redis) {
        await this.redis.set(blockKey, JSON.stringify({
          reason,
          blockedAt: Date.now(),
          expiresAt: Date.now() + durationMs,
        }), { EX: durationSeconds });
      }
      
      // Emit metrics
      this.emitMetrics({
        type: 'block',
        identifier,
        reason,
        durationMs,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[RateLimiter] Failed to block identifier:', error);
    }
  }

  /**
   * Unblock an IP
   */
  async unblockIdentifier(identifier: string): Promise<void> {
    const blockKey = `rl:blocked:${identifier}`;
    
    try {
      if (this.redis) {
        await this.redis.del(blockKey);
      }
    } catch (error) {
      console.error('[RateLimiter] Failed to unblock identifier:', error);
    }
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private getTierForPath(path: string): RateLimitTier {
    for (const tier of this.tiers) {
      if (tier.pathPatterns.some(pattern => pattern.test(path))) {
        return tier;
      }
    }
    return this.tiers[this.tiers.length - 1]; // Default to last (global)
  }

  private buildKey(tier: RateLimitTier, identifier: string, tenantId?: string): string {
    const parts = [tier.config.keyPrefix || `rl:${tier.name}`];
    if (tenantId) parts.push(tenantId);
    parts.push(identifier);
    return parts.join(':');
  }

  private async checkRedisLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    if (!this.redis) {
      return this.checkInMemoryLimit(key, config);
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Use sorted set for sliding window
    const windowKey = `${key}:window`;
    const requestId = `${now}:${Math.random().toString(36).slice(2)}`;
    
    // Remove old entries and add new one
    await this.redis.zremrangebyscore(windowKey, 0, windowStart);
    await this.redis.zadd(windowKey, now, requestId);
    await this.redis.expire(windowKey, Math.ceil(config.windowMs / 1000));
    
    // Count requests in window
    const count = await this.redis.zcount(windowKey, windowStart, now);
    
    const allowed = count <= config.limit;
    const remaining = Math.max(0, config.limit - count);
    const resetAt = now + config.windowMs;
    
    // Check violations and potentially block
    if (!allowed && config.blockThreshold && config.blockDurationMs) {
      const violationKey = `${key}:violations`;
      const violations = await this.redis.incr(violationKey);
      await this.redis.expire(violationKey, Math.ceil(config.windowMs / 1000) * 2);
      
      if (violations >= config.blockThreshold) {
        await this.blockIdentifier(key, config.blockDurationMs, 'Rate limit violations');
      }
    }
    
    // Emit metrics
    this.emitMetrics({
      type: 'check',
      key,
      allowed,
      count,
      limit: config.limit,
      timestamp: now,
    });
    
    return {
      allowed,
      remaining,
      resetAt,
      blocked: !allowed,
      retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
      totalRequests: count,
    };
  }

  private checkInMemoryLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = this.fallbackStore.get(key);
    
    // New window or expired
    if (!entry || now >= entry.resetAt) {
      this.fallbackStore.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetAt: now + config.windowMs,
        blocked: false,
        totalRequests: 1,
      };
    }
    
    // Within window
    if (entry.count < config.limit) {
      entry.count++;
      return {
        allowed: true,
        remaining: config.limit - entry.count,
        resetAt: entry.resetAt,
        blocked: false,
        totalRequests: entry.count,
      };
    }
    
    // Exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      blocked: true,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      totalRequests: entry.count,
    };
  }

  private cleanupFallbackStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.fallbackStore.entries()) {
      if (now >= entry.resetAt) {
        this.fallbackStore.delete(key);
      }
    }
  }

  private emitMetrics(metrics: RateLimitMetrics): void {
    if (this.metricsCallback) {
      this.metricsCallback(metrics);
    }
  }
}

// ============================================
// METRICS TYPES
// ============================================

export interface RateLimitMetrics {
  type: 'check' | 'block' | 'unblock';
  key?: string;
  identifier?: string;
  allowed?: boolean;
  count?: number;
  limit?: number;
  reason?: string;
  durationMs?: number;
  timestamp: number;
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let rateLimiterInstance: RedisRateLimiter | null = null;

export function getRedisRateLimiter(): RedisRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RedisRateLimiter();
  }
  return rateLimiterInstance;
}

export function initializeRedisRateLimiter(redisClient: RedisClient): RedisRateLimiter {
  rateLimiterInstance = new RedisRateLimiter(redisClient);
  return rateLimiterInstance;
}

// ============================================
// MIDDLEWARE HELPER
// ============================================

/**
 * Create rate limit headers for HTTP response
 */
export function createRateLimitHeaders(result: RateLimitResult, tierName: string): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + result.totalRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
    'X-RateLimit-Tier': tierName,
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  };
}

export default RedisRateLimiter;


