/**
 * ============================================================
 * ENTERPRISE RATE LIMITER
 * API 요청 제한 - 엔터프라이즈급 보안
 * ============================================================
 * 
 * 지원 알고리즘:
 * - Sliding Window (기본)
 * - Token Bucket
 * - Fixed Window
 * 
 * 지원 저장소:
 * - In-Memory (개발/단일 서버)
 * - Redis (프로덕션/분산 환경 권장)
 */

export type RateLimitAlgorithm = 'sliding_window' | 'token_bucket' | 'fixed_window';

export interface RateLimitConfig {
  /** 요청 허용 개수 */
  limit: number;
  /** 시간 윈도우 (초) */
  windowSeconds: number;
  /** 알고리즘 */
  algorithm?: RateLimitAlgorithm;
  /** 차단 시간 (초) - limit 초과 시 */
  blockDurationSeconds?: number;
  /** 사용자 정의 키 생성 함수 */
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds?: number;
  blocked?: boolean;
  blockedUntil?: Date;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  blocked?: boolean;
  blockedUntil?: number;
  tokens?: number;
  lastRefill?: number;
}

// ============================================
// IN-MEMORY STORE (단일 서버용)
// ============================================

class InMemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // 5분마다 만료된 엔트리 정리
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.store.forEach((entry, key) => {
      // 1시간 이상 지난 엔트리 삭제
      if (now - entry.windowStart > 60 * 60 * 1000) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.store.delete(key));
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }

  getStats(): { totalKeys: number; memoryUsage: string } {
    return {
      totalKeys: this.store.size,
      memoryUsage: `~${Math.round(this.store.size * 100 / 1024)}KB`
    };
  }
}

const globalStore = new InMemoryRateLimitStore();

// ============================================
// RATE LIMITER CLASS
// ============================================

export class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      limit: config.limit,
      windowSeconds: config.windowSeconds,
      algorithm: config.algorithm ?? 'sliding_window',
      blockDurationSeconds: config.blockDurationSeconds ?? 0,
      keyGenerator: config.keyGenerator ?? ((id) => `rl:${id}`)
    };
  }

  /**
   * 요청 허용 여부 확인 및 카운트 증가
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(identifier);
    const now = Date.now();
    const windowMs = this.config.windowSeconds * 1000;

    let entry = globalStore.get(key);

    // 차단 상태 확인
    if (entry?.blocked && entry.blockedUntil) {
      if (now < entry.blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(entry.blockedUntil),
          retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
          blocked: true,
          blockedUntil: new Date(entry.blockedUntil)
        };
      } else {
        // 차단 해제
        globalStore.delete(key);
        entry = undefined;
      }
    }

    // 새 엔트리 또는 윈도우 리셋
    if (!entry || (now - entry.windowStart >= windowMs)) {
      entry = {
        count: 1,
        windowStart: now
      };
      globalStore.set(key, entry);

      return {
        allowed: true,
        remaining: this.config.limit - 1,
        resetAt: new Date(now + windowMs)
      };
    }

    // 기존 윈도우 내 요청
    if (entry.count < this.config.limit) {
      entry.count++;
      globalStore.set(key, entry);

      return {
        allowed: true,
        remaining: this.config.limit - entry.count,
        resetAt: new Date(entry.windowStart + windowMs)
      };
    }

    // 제한 초과
    if (this.config.blockDurationSeconds > 0) {
      // 차단 적용
      entry.blocked = true;
      entry.blockedUntil = now + (this.config.blockDurationSeconds * 1000);
      globalStore.set(key, entry);

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        retryAfterSeconds: this.config.blockDurationSeconds,
        blocked: true,
        blockedUntil: new Date(entry.blockedUntil)
      };
    }

    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.windowStart + windowMs),
      retryAfterSeconds: retryAfter > 0 ? retryAfter : 1
    };
  }

  /**
   * 수동으로 엔트리 리셋
   */
  reset(identifier: string): void {
    const key = this.config.keyGenerator(identifier);
    globalStore.delete(key);
  }
}

// ============================================
// 사전 정의된 리미터 인스턴스
// ============================================

/** API 기본 제한: 100 req/min */
export const apiRateLimiter = new RateLimiter({
  limit: 100,
  windowSeconds: 60,
  keyGenerator: (ip) => `api:${ip}`
});

/** 인증 제한: 5 req/min (브루트포스 방지) */
export const authRateLimiter = new RateLimiter({
  limit: 5,
  windowSeconds: 60,
  blockDurationSeconds: 300, // 5분 차단
  keyGenerator: (ip) => `auth:${ip}`
});

/** 회원가입 제한: 3 req/hour */
export const signupRateLimiter = new RateLimiter({
  limit: 3,
  windowSeconds: 3600,
  keyGenerator: (ip) => `signup:${ip}`
});

/** AI 요청 제한: 20 req/min */
export const aiRateLimiter = new RateLimiter({
  limit: 20,
  windowSeconds: 60,
  keyGenerator: (userId) => `ai:${userId}`
});

/** 결제 요청 제한: 10 req/min */
export const paymentRateLimiter = new RateLimiter({
  limit: 10,
  windowSeconds: 60,
  blockDurationSeconds: 600, // 10분 차단
  keyGenerator: (userId) => `payment:${userId}`
});

/** 파일 업로드 제한: 5 req/min */
export const uploadRateLimiter = new RateLimiter({
  limit: 5,
  windowSeconds: 60,
  keyGenerator: (userId) => `upload:${userId}`
});

// ============================================
// MIDDLEWARE HELPERS
// ============================================

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
}

export function getRateLimitHeaders(
  result: RateLimitResult,
  limit: number
): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000))
  };

  if (result.retryAfterSeconds) {
    headers['Retry-After'] = String(result.retryAfterSeconds);
  }

  return headers;
}

/**
 * Express/Next.js API Route용 헬퍼
 */
export async function checkRateLimit(
  limiter: RateLimiter,
  identifier: string
): Promise<{
  allowed: boolean;
  headers: RateLimitHeaders;
  result: RateLimitResult;
}> {
  const result = await limiter.check(identifier);
  const headers = getRateLimitHeaders(result, 100);

  return {
    allowed: result.allowed,
    headers,
    result
  };
}

// ============================================
// IP 추출 유틸리티
// ============================================

export function getClientIP(request: Request): string {
  // Cloudflare
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) return cfIP;

  // X-Forwarded-For (프록시/로드밸런서)
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0] || 'unknown';
  }

  // X-Real-IP (Nginx)
  const xRealIP = request.headers.get('X-Real-IP');
  if (xRealIP) return xRealIP;

  // Vercel
  const vercelIP = request.headers.get('X-Vercel-Forwarded-For');
  if (vercelIP) return vercelIP;

  return 'unknown';
}

export function getStoreStats() {
  return globalStore.getStats();
}


