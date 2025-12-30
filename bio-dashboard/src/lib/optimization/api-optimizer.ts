/**
 * ============================================================
 * MANPASIK SYSTEM OPTIMIZATION - API OPTIMIZER
 * Request Batching, Caching, & Compression
 * ============================================================
 */

import { NETWORK_CONFIG, CACHE_CONFIG } from './performance-config';

// ============================================
// REQUEST QUEUE FOR BATCHING
// ============================================

interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  priority: number;
  resolve: (data: unknown) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

class APIOptimizer {
  private queue: QueuedRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private cache = new Map<string, { data: unknown; expiry: number }>();
  private pendingRequests = new Map<string, Promise<unknown>>();

  /**
   * Optimized fetch with caching, batching, and deduplication
   */
  async fetch<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      priority?: number;
      cacheTTL?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      priority = NETWORK_CONFIG.PRIORITY.normal,
      cacheTTL = CACHE_CONFIG.API_CACHE_TTL.healthScore * 1000,
      skipCache = false,
    } = options;

    const cacheKey = this.getCacheKey(endpoint, method, body);

    // 1. Check cache (for GET requests)
    if (method === 'GET' && !skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        console.log(`[API] Cache hit: ${endpoint}`);
        return cached.data as T;
      }
    }

    // 2. Check for pending duplicate request
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`[API] Deduplicating: ${endpoint}`);
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    // 3. Create request promise
    const requestPromise = new Promise<T>((resolve, reject) => {
      const request: QueuedRequest = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        endpoint,
        method,
        body,
        priority,
        resolve: resolve as (data: unknown) => void,
        reject,
        timestamp: Date.now(),
      };

      this.queue.push(request);
      this.scheduleFlush();
    });

    // 4. Track pending request
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // 5. Cache the result (for GET requests)
      if (method === 'GET') {
        this.cache.set(cacheKey, {
          data: result,
          expiry: Date.now() + cacheTTL,
        });
      }

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Schedule batch flush
   */
  private scheduleFlush() {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.flush();
    }, NETWORK_CONFIG.BATCH_WINDOW_MS);
  }

  /**
   * Flush queued requests
   */
  private async flush() {
    this.batchTimeout = null;

    if (this.queue.length === 0) return;

    // Sort by priority
    this.queue.sort((a, b) => a.priority - b.priority);

    // Process in batches
    const batch = this.queue.splice(0, NETWORK_CONFIG.MAX_BATCH_SIZE);

    console.log(`[API] Flushing ${batch.length} requests`);

    // Check if requests can be batched into a single call
    const batchableRequests = batch.filter(r => 
      r.method === 'GET' && r.endpoint.startsWith('/api/')
    );

    if (batchableRequests.length > 1) {
      await this.executeBatchedRequest(batchableRequests);
    } else {
      // Execute individually
      await Promise.all(batch.map(req => this.executeRequest(req)));
    }

    // Continue flushing if more in queue
    if (this.queue.length > 0) {
      this.scheduleFlush();
    }
  }

  /**
   * Execute batched request
   */
  private async executeBatchedRequest(requests: QueuedRequest[]) {
    try {
      const endpoints = requests.map(r => r.endpoint);
      
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints }),
      });

      if (!response.ok) {
        throw new Error('Batch request failed');
      }

      const results = await response.json();

      // Resolve individual requests
      requests.forEach((req, i) => {
        if (results[i]?.success) {
          req.resolve(results[i].data);
        } else {
          req.reject(new Error(results[i]?.error || 'Unknown error'));
        }
      });

    } catch (error) {
      // Fall back to individual requests
      await Promise.all(requests.map(req => this.executeRequest(req)));
    }
  }

  /**
   * Execute single request with retry
   */
  private async executeRequest(request: QueuedRequest, retryCount = 0) {
    try {
      const response = await fetch(request.endpoint, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      request.resolve(data);

    } catch (error) {
      // Retry logic
      if (retryCount < NETWORK_CONFIG.RETRY.maxRetries) {
        const delay = Math.min(
          NETWORK_CONFIG.RETRY.baseDelay * Math.pow(NETWORK_CONFIG.RETRY.backoffFactor, retryCount),
          NETWORK_CONFIG.RETRY.maxDelay
        );

        console.log(`[API] Retrying ${request.endpoint} in ${delay}ms (attempt ${retryCount + 1})`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeRequest(request, retryCount + 1);
      }

      request.reject(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(endpoint: string, method: string, body?: unknown): string {
    return `${method}:${endpoint}:${body ? JSON.stringify(body) : ''}`;
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Prefetch endpoints
   */
  async prefetch(endpoints: string[]) {
    console.log(`[API] Prefetching ${endpoints.length} endpoints`);
    
    await Promise.all(
      endpoints.map(endpoint => 
        this.fetch(endpoint, { priority: NETWORK_CONFIG.PRIORITY.low })
          .catch(() => {}) // Silently ignore prefetch errors
      )
    );
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      queueLength: this.queue.length,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

// Singleton instance
export const apiOptimizer = new APIOptimizer();

// ============================================
// OPTIMIZED FETCH HOOK
// ============================================

export async function optimizedFetch<T>(
  endpoint: string,
  options?: Parameters<APIOptimizer['fetch']>[1]
): Promise<T> {
  return apiOptimizer.fetch<T>(endpoint, options);
}




