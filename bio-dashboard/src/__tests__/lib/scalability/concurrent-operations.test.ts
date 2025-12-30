/**
 * ============================================================
 * CONCURRENT OPERATIONS TESTS
 * 동시성 및 확장성 테스트
 * ============================================================
 */

describe('Concurrent Operations (Scalability)', () => {
  // ============================================
  // Race Condition Detection
  // ============================================
  describe('Race Condition Detection', () => {
    it('should detect potential race conditions in balance updates', async () => {
      // Simulate concurrent balance reads
      const initialBalance = 100;
      const deductions: number[] = [];
      
      // Two concurrent operations reading the same balance
      const operation1 = async () => {
        const balance = initialBalance; // Read
        await new Promise(r => setTimeout(r, 10)); // Simulate delay
        if (balance >= 60) {
          deductions.push(60);
          return initialBalance - 60;
        }
        return initialBalance;
      };

      const operation2 = async () => {
        const balance = initialBalance; // Read same value
        await new Promise(r => setTimeout(r, 5)); // Different delay
        if (balance >= 60) {
          deductions.push(60);
          return initialBalance - 60;
        }
        return initialBalance;
      };

      // Both operations run concurrently
      await Promise.all([operation1(), operation2()]);

      // This demonstrates the race condition:
      // Both operations saw balance = 100 and each deducted 60
      // Total deducted = 120, which is more than available!
      expect(deductions.length).toBe(2);
      expect(deductions.reduce((a, b) => a + b, 0)).toBe(120);
      
      // This test PASSES to show the vulnerability exists
      // In production, we need mutex/locking to prevent this
    });

    it('should demonstrate optimistic locking pattern', async () => {
      interface VersionedBalance {
        balance: number;
        version: number;
      }

      const state: VersionedBalance = { balance: 100, version: 1 };
      
      const updateWithOptimisticLock = async (
        amount: number,
        expectedVersion: number
      ): Promise<boolean> => {
        // Simulate read
        const current = { ...state };
        
        // Check version
        if (current.version !== expectedVersion) {
          return false; // Concurrent modification detected
        }
        
        if (current.balance < amount) {
          return false; // Insufficient balance
        }
        
        // Simulate processing delay
        await new Promise(r => setTimeout(r, 10));
        
        // Check version again before write
        if (state.version !== expectedVersion) {
          return false; // Another operation modified the state
        }
        
        // Apply update
        state.balance -= amount;
        state.version += 1;
        return true;
      };

      // First update should succeed
      const result1 = await updateWithOptimisticLock(50, 1);
      expect(result1).toBe(true);
      expect(state.balance).toBe(50);
      expect(state.version).toBe(2);

      // Second update with old version should fail
      const result2 = await updateWithOptimisticLock(30, 1);
      expect(result2).toBe(false);

      // Third update with correct version should succeed
      const result3 = await updateWithOptimisticLock(30, 2);
      expect(result3).toBe(true);
      expect(state.balance).toBe(20);
    });
  });

  // ============================================
  // High-Volume Simulation
  // ============================================
  describe('High-Volume Simulation', () => {
    it('should handle 1000 sequential transactions correctly', () => {
      let balance = 10000;
      const transactions: { amount: number; success: boolean }[] = [];

      for (let i = 0; i < 1000; i++) {
        const amount = Math.floor(Math.random() * 20) + 1;
        
        if (balance >= amount) {
          balance -= amount;
          transactions.push({ amount, success: true });
        } else {
          transactions.push({ amount, success: false });
        }
      }

      const totalDeducted = transactions
        .filter(t => t.success)
        .reduce((sum, t) => sum + t.amount, 0);

      expect(balance).toBe(10000 - totalDeducted);
      expect(balance).toBeGreaterThanOrEqual(0);
    });

    it('should maintain consistency in vote counting', () => {
      interface Idea {
        id: string;
        voteCount: number;
        voters: Set<string>;
      }

      const idea: Idea = {
        id: 'idea-1',
        voteCount: 0,
        voters: new Set()
      };

      const vote = (userId: string): boolean => {
        if (idea.voters.has(userId)) {
          return false; // Already voted
        }
        idea.voters.add(userId);
        idea.voteCount += 1;
        return true;
      };

      // Simulate 100 users voting
      const results: boolean[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(vote(`user-${i}`));
      }

      expect(results.filter(r => r).length).toBe(100);
      expect(idea.voteCount).toBe(100);

      // Simulate same user voting twice
      const duplicateVote = vote('user-50');
      expect(duplicateVote).toBe(false);
      expect(idea.voteCount).toBe(100); // Count unchanged
    });

    it('should correctly paginate large result sets', () => {
      const totalItems = 10000;
      const pageSize = 20;
      const items = Array.from({ length: totalItems }, (_, i) => ({
        id: `item-${i}`,
        createdAt: new Date(Date.now() - i * 60000)
      }));

      const getPage = (page: number) => {
        const start = page * pageSize;
        const end = start + pageSize;
        return {
          items: items.slice(start, end),
          total: totalItems,
          page,
          pageSize,
          totalPages: Math.ceil(totalItems / pageSize)
        };
      };

      const page0 = getPage(0);
      expect(page0.items.length).toBe(20);
      expect(page0.items[0].id).toBe('item-0');
      expect(page0.totalPages).toBe(500);

      const page499 = getPage(499);
      expect(page499.items.length).toBe(20);
      expect(page499.items[0].id).toBe('item-9980');

      const page500 = getPage(500);
      expect(page500.items.length).toBe(0); // Beyond last page
    });
  });

  // ============================================
  // Cache Invalidation Patterns
  // ============================================
  describe('Cache Invalidation Patterns', () => {
    it('should implement cache-aside pattern correctly', async () => {
      const cache = new Map<string, { data: unknown; expiry: number }>();
      const db = new Map<string, unknown>([['key1', { value: 'original' }]]);
      const TTL = 60000; // 1 minute

      const get = async (key: string): Promise<unknown> => {
        // Check cache first
        const cached = cache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.data;
        }

        // Miss: fetch from DB
        const data = db.get(key);
        if (data) {
          cache.set(key, { data, expiry: Date.now() + TTL });
        }
        return data;
      };

      const set = async (key: string, value: unknown): Promise<void> => {
        // Write to DB
        db.set(key, value);
        // Invalidate cache
        cache.delete(key);
      };

      // First read: cache miss
      const result1 = await get('key1');
      expect(result1).toEqual({ value: 'original' });
      expect(cache.has('key1')).toBe(true);

      // Second read: cache hit
      const result2 = await get('key1');
      expect(result2).toEqual({ value: 'original' });

      // Update: invalidates cache
      await set('key1', { value: 'updated' });
      expect(cache.has('key1')).toBe(false);

      // Third read: cache miss, gets updated value
      const result3 = await get('key1');
      expect(result3).toEqual({ value: 'updated' });
    });

    it('should handle cache stampede protection', async () => {
      const pendingFetches = new Map<string, Promise<unknown>>();
      
      const fetchWithDedup = async (key: string): Promise<unknown> => {
        // If there's already a fetch in progress, wait for it
        if (pendingFetches.has(key)) {
          return pendingFetches.get(key);
        }

        // Start new fetch
        const fetchPromise = new Promise(resolve => {
          setTimeout(() => resolve({ key, data: 'fetched' }), 100);
        });

        pendingFetches.set(key, fetchPromise);
        
        try {
          return await fetchPromise;
        } finally {
          pendingFetches.delete(key);
        }
      };

      // Simulate 10 concurrent requests for same key
      const startTime = Date.now();
      const results = await Promise.all(
        Array.from({ length: 10 }, () => fetchWithDedup('key1'))
      );
      const endTime = Date.now();

      // All should get same result
      expect(results.every(r => JSON.stringify(r) === JSON.stringify(results[0]))).toBe(true);
      
      // Should complete in roughly 100ms (one fetch), not 1000ms (ten fetches)
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  // ============================================
  // Connection Pool Simulation
  // ============================================
  describe('Connection Pool Simulation', () => {
    it('should manage connection pool correctly', async () => {
      class ConnectionPool {
        private available: number[] = [];
        private inUse: Set<number> = new Set();
        private maxSize: number;
        private nextId = 0;

        constructor(maxSize: number) {
          this.maxSize = maxSize;
        }

        async acquire(): Promise<number> {
          if (this.available.length > 0) {
            const conn = this.available.pop()!;
            this.inUse.add(conn);
            return conn;
          }

          if (this.inUse.size < this.maxSize) {
            const conn = this.nextId++;
            this.inUse.add(conn);
            return conn;
          }

          throw new Error('Connection pool exhausted');
        }

        release(conn: number): void {
          if (this.inUse.has(conn)) {
            this.inUse.delete(conn);
            this.available.push(conn);
          }
        }

        getStats() {
          return {
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size
          };
        }
      }

      const pool = new ConnectionPool(5);

      // Acquire 3 connections
      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();
      const conn3 = await pool.acquire();

      expect(pool.getStats().inUse).toBe(3);
      expect(pool.getStats().available).toBe(0);

      // Release 1
      pool.release(conn2);
      expect(pool.getStats().inUse).toBe(2);
      expect(pool.getStats().available).toBe(1);

      // Acquire 2 more (one from pool, one new)
      const conn4 = await pool.acquire();
      const conn5 = await pool.acquire();
      expect(pool.getStats().inUse).toBe(4);

      // Acquire 1 more (new)
      const conn6 = await pool.acquire();
      expect(pool.getStats().inUse).toBe(5);

      // Try to acquire when pool is exhausted
      await expect(pool.acquire()).rejects.toThrow('Connection pool exhausted');
    });
  });
});


