/**
 * ============================================================
 * OFFLINE SYNC QUEUE
 * Reliable data synchronization for offline-first operation
 * ============================================================
 * 
 * Core Principle: "Never Lose Data"
 * - Queue all operations when offline
 * - Persist to IndexedDB for durability
 * - Automatically sync when connection restored
 * - Handle conflicts intelligently
 */

import { EventEmitter } from 'events';

// ============================================
// TYPES
// ============================================

export enum SyncItemStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
  CONFLICT = 'conflict',
}

export enum SyncItemType {
  MEASUREMENT = 'measurement',
  CALIBRATION = 'calibration',
  USER_ACTION = 'user_action',
  DEVICE_CONFIG = 'device_config',
  FEEDBACK = 'feedback',
  HEALTH_RECORD = 'health_record',
}

export interface SyncItem {
  id: string;
  type: SyncItemType;
  data: unknown;
  metadata: {
    deviceId?: string;
    userId?: string;
    createdAt: number;
    attempts: number;
    lastAttempt?: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
  };
  status: SyncItemStatus;
  error?: string;
  serverResponse?: unknown;
}

export interface SyncQueueConfig {
  dbName: string;
  storeName: string;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  syncInterval: number;
  maxQueueSize: number;
}

export interface SyncStats {
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  conflict: number;
  totalSize: number;
  oldestItem?: number;
}

export interface ConflictResolution {
  itemId: string;
  resolution: 'keep_local' | 'keep_server' | 'merge';
  mergedData?: unknown;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_CONFIG: SyncQueueConfig = {
  dbName: 'mps_offline_db',
  storeName: 'sync_queue',
  maxRetries: 5,
  retryDelay: 5000,
  batchSize: 20,
  syncInterval: 30000, // 30 seconds
  maxQueueSize: 10000,
};

// ============================================
// INDEXEDDB WRAPPER
// ============================================

class IndexedDBStore {
  private db: IDBDatabase | null = null;
  private config: SyncQueueConfig;

  constructor(config: SyncQueueConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB not supported');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('createdAt', 'metadata.createdAt', { unique: false });
          store.createIndex('priority', 'metadata.priority', { unique: false });
        }
      };
    });
  }

  async add(item: SyncItem): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async update(item: SyncItem): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(id: string): Promise<SyncItem | undefined> {
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByStatus(status: SyncItemStatus): Promise<SyncItem[]> {
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const index = store.index('status');
      const request = index.getAll(status);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<SyncItem[]> {
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async count(): Promise<number> {
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================
// OFFLINE SYNC QUEUE
// ============================================

export class OfflineSyncQueue extends EventEmitter {
  private static instance: OfflineSyncQueue | null = null;
  
  private config: SyncQueueConfig;
  private store: IndexedDBStore;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private apiEndpoint: string = '/api';

  private constructor(config: Partial<SyncQueueConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = new IndexedDBStore(this.config);
    this.initialize();
  }

  public static getInstance(config?: Partial<SyncQueueConfig>): OfflineSyncQueue {
    if (!OfflineSyncQueue.instance) {
      OfflineSyncQueue.instance = new OfflineSyncQueue(config);
    }
    return OfflineSyncQueue.instance;
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private async initialize(): Promise<void> {
    await this.store.init();
    
    // Check initial online status
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
    
    // Start sync timer
    this.startSyncTimer();
    
    // Initial sync if online
    if (this.isOnline) {
      setTimeout(() => this.sync(), 1000);
    }
    
    this.emit('initialized');
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.emit('online');
    
    // Trigger immediate sync
    this.sync();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.emit('offline');
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, this.config.syncInterval);
  }

  // ============================================
  // QUEUE OPERATIONS
  // ============================================

  /**
   * Add item to sync queue
   */
  public async enqueue(
    type: SyncItemType,
    data: unknown,
    options: {
      deviceId?: string;
      userId?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
    } = {}
  ): Promise<string> {
    // Check queue size
    const count = await this.store.count();
    if (count >= this.config.maxQueueSize) {
      throw new Error('Sync queue is full. Please sync or clear old data.');
    }
    
    const id = this.generateId();
    const item: SyncItem = {
      id,
      type,
      data,
      metadata: {
        deviceId: options.deviceId,
        userId: options.userId,
        createdAt: Date.now(),
        attempts: 0,
        priority: options.priority || 'normal',
      },
      status: SyncItemStatus.PENDING,
    };
    
    await this.store.add(item);
    this.emit('itemAdded', item);
    
    // Try immediate sync if online and critical
    if (this.isOnline && options.priority === 'critical') {
      this.syncItem(item);
    }
    
    return id;
  }

  /**
   * Queue a measurement for sync
   */
  public async queueMeasurement(
    measurementData: {
      deviceId: string;
      userId: string;
      concentrationMmolL: number;
      rawVoltage: number[];
      temperature?: number;
      timestamp: number;
    },
    priority: 'normal' | 'high' = 'normal'
  ): Promise<string> {
    return this.enqueue(SyncItemType.MEASUREMENT, measurementData, {
      deviceId: measurementData.deviceId,
      userId: measurementData.userId,
      priority,
    });
  }

  /**
   * Queue calibration data for sync
   */
  public async queueCalibration(
    calibrationData: {
      deviceId: string;
      slope: number;
      intercept: number;
      rSquared: number;
      timestamp: number;
    }
  ): Promise<string> {
    return this.enqueue(SyncItemType.CALIBRATION, calibrationData, {
      deviceId: calibrationData.deviceId,
      priority: 'high',
    });
  }

  /**
   * Remove item from queue
   */
  public async dequeue(id: string): Promise<void> {
    await this.store.delete(id);
    this.emit('itemRemoved', id);
  }

  /**
   * Get pending items
   */
  public async getPendingItems(): Promise<SyncItem[]> {
    return this.store.getByStatus(SyncItemStatus.PENDING);
  }

  /**
   * Get failed items
   */
  public async getFailedItems(): Promise<SyncItem[]> {
    return this.store.getByStatus(SyncItemStatus.FAILED);
  }

  /**
   * Get all items
   */
  public async getAllItems(): Promise<SyncItem[]> {
    return this.store.getAll();
  }

  /**
   * Get queue statistics
   */
  public async getStats(): Promise<SyncStats> {
    const items = await this.store.getAll();
    
    const stats: SyncStats = {
      pending: 0,
      syncing: 0,
      synced: 0,
      failed: 0,
      conflict: 0,
      totalSize: items.length,
    };
    
    let oldestTime = Infinity;
    
    for (const item of items) {
      stats[item.status as keyof Pick<SyncStats, 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'>]++;
      
      if (item.metadata.createdAt < oldestTime) {
        oldestTime = item.metadata.createdAt;
      }
    }
    
    if (oldestTime < Infinity) {
      stats.oldestItem = oldestTime;
    }
    
    return stats;
  }

  // ============================================
  // SYNC OPERATIONS
  // ============================================

  /**
   * Sync all pending items
   */
  public async sync(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline) {
      this.emit('syncSkipped', 'offline');
      return { synced: 0, failed: 0 };
    }
    
    if (this.isSyncing) {
      this.emit('syncSkipped', 'already syncing');
      return { synced: 0, failed: 0 };
    }
    
    this.isSyncing = true;
    this.emit('syncStarted');
    
    let synced = 0;
    let failed = 0;
    
    try {
      // Get pending items sorted by priority and creation time
      const pendingItems = await this.store.getByStatus(SyncItemStatus.PENDING);
      const sortedItems = pendingItems.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff = priorityOrder[a.metadata.priority] - priorityOrder[b.metadata.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.metadata.createdAt - b.metadata.createdAt;
      });
      
      // Process in batches
      for (let i = 0; i < sortedItems.length; i += this.config.batchSize) {
        const batch = sortedItems.slice(i, i + this.config.batchSize);
        const results = await Promise.allSettled(
          batch.map(item => this.syncItem(item))
        );
        
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            synced++;
          } else {
            failed++;
          }
        }
        
        this.emit('syncProgress', {
          processed: i + batch.length,
          total: sortedItems.length,
          synced,
          failed,
        });
      }
      
      // Retry failed items (up to max retries)
      await this.retryFailed();
      
    } catch (error) {
      this.emit('syncError', error);
    } finally {
      this.isSyncing = false;
      this.emit('syncCompleted', { synced, failed });
    }
    
    return { synced, failed };
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncItem): Promise<boolean> {
    // Update status
    item.status = SyncItemStatus.SYNCING;
    item.metadata.attempts++;
    item.metadata.lastAttempt = Date.now();
    await this.store.update(item);
    
    try {
      // Send to server
      const endpoint = this.getEndpointForType(item.type);
      const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Sync': 'true',
          'X-Sync-Item-Id': item.id,
        },
        body: JSON.stringify(item.data),
      });
      
      if (response.ok) {
        const serverResponse = await response.json();
        item.status = SyncItemStatus.SYNCED;
        item.serverResponse = serverResponse;
        await this.store.update(item);
        
        this.emit('itemSynced', item);
        
        // Clean up synced items after a delay
        setTimeout(() => this.dequeue(item.id), 60000);
        
        return true;
      } else if (response.status === 409) {
        // Conflict detected
        item.status = SyncItemStatus.CONFLICT;
        item.serverResponse = await response.json();
        await this.store.update(item);
        
        this.emit('itemConflict', item);
        return false;
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
      
    } catch (error) {
      item.status = SyncItemStatus.FAILED;
      item.error = (error as Error).message;
      await this.store.update(item);
      
      this.emit('itemFailed', item);
      return false;
    }
  }

  /**
   * Retry failed items
   */
  private async retryFailed(): Promise<void> {
    const failedItems = await this.store.getByStatus(SyncItemStatus.FAILED);
    
    for (const item of failedItems) {
      if (item.metadata.attempts < this.config.maxRetries) {
        // Reset to pending for retry
        item.status = SyncItemStatus.PENDING;
        await this.store.update(item);
      }
    }
  }

  /**
   * Force retry all failed items
   */
  public async retryAllFailed(): Promise<void> {
    const failedItems = await this.store.getByStatus(SyncItemStatus.FAILED);
    
    for (const item of failedItems) {
      item.status = SyncItemStatus.PENDING;
      item.metadata.attempts = 0;
      await this.store.update(item);
    }
    
    await this.sync();
  }

  // ============================================
  // CONFLICT RESOLUTION
  // ============================================

  /**
   * Resolve a conflict
   */
  public async resolveConflict(resolution: ConflictResolution): Promise<void> {
    const item = await this.store.get(resolution.itemId);
    if (!item || item.status !== SyncItemStatus.CONFLICT) {
      throw new Error('Item not found or not in conflict state');
    }
    
    switch (resolution.resolution) {
      case 'keep_local':
        // Re-send local data with force flag
        item.data = { ...item.data as object, _forceOverwrite: true };
        item.status = SyncItemStatus.PENDING;
        item.metadata.attempts = 0;
        await this.store.update(item);
        break;
        
      case 'keep_server':
        // Discard local data
        await this.store.delete(item.id);
        break;
        
      case 'merge':
        // Use merged data
        if (!resolution.mergedData) {
          throw new Error('Merged data required for merge resolution');
        }
        item.data = resolution.mergedData;
        item.status = SyncItemStatus.PENDING;
        item.metadata.attempts = 0;
        await this.store.update(item);
        break;
    }
    
    this.emit('conflictResolved', { itemId: resolution.itemId, resolution: resolution.resolution });
    
    // Try sync again
    if (resolution.resolution !== 'keep_server') {
      await this.sync();
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private getEndpointForType(type: SyncItemType): string {
    switch (type) {
      case SyncItemType.MEASUREMENT:
        return '/measurements';
      case SyncItemType.CALIBRATION:
        return '/calibrations';
      case SyncItemType.USER_ACTION:
        return '/user-actions';
      case SyncItemType.DEVICE_CONFIG:
        return '/device-config';
      case SyncItemType.FEEDBACK:
        return '/feedback';
      case SyncItemType.HEALTH_RECORD:
        return '/health-records';
      default:
        return '/sync';
    }
  }

  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set API endpoint (for switching between cloud and local server)
   */
  public setApiEndpoint(endpoint: string): void {
    this.apiEndpoint = endpoint;
    this.emit('endpointChanged', endpoint);
  }

  /**
   * Clear all synced items
   */
  public async clearSynced(): Promise<number> {
    const syncedItems = await this.store.getByStatus(SyncItemStatus.SYNCED);
    
    for (const item of syncedItems) {
      await this.store.delete(item.id);
    }
    
    return syncedItems.length;
  }

  /**
   * Clear all items
   */
  public async clearAll(): Promise<void> {
    await this.store.clear();
    this.emit('queueCleared');
  }

  /**
   * Export queue data as JSON
   */
  public async exportQueue(): Promise<string> {
    const items = await this.store.getAll();
    return JSON.stringify(items, null, 2);
  }

  /**
   * Import queue data from JSON
   */
  public async importQueue(json: string): Promise<number> {
    const items: SyncItem[] = JSON.parse(json);
    
    for (const item of items) {
      // Re-generate ID to avoid conflicts
      item.id = this.generateId();
      item.status = SyncItemStatus.PENDING;
      await this.store.add(item);
    }
    
    return items.length;
  }

  public isOnlineStatus(): boolean {
    return this.isOnline;
  }

  public isSyncingStatus(): boolean {
    return this.isSyncing;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const offlineSyncQueue = OfflineSyncQueue.getInstance();

export default OfflineSyncQueue;


