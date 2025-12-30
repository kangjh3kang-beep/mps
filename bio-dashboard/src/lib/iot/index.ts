/**
 * ============================================================
 * IoT MODULE INDEX
 * Multi-Device Connectivity & Offline Sync
 * ============================================================
 */

// Device Manager
export {
  DeviceManager,
  deviceManager,
  ConnectionType,
  DeviceStatus,
  NetworkMode,
  DeviceCapability,
  CommandType,
  type DeviceInfo,
  type DeviceCommand,
  type CommandResult,
  type DiscoveredDevice,
  type DeviceManagerConfig,
} from './DeviceManager';

// Offline Sync Queue
export {
  OfflineSyncQueue,
  offlineSyncQueue,
  SyncItemStatus,
  SyncItemType,
  type SyncItem,
  type SyncQueueConfig,
  type SyncStats,
  type ConflictResolution,
} from './OfflineSyncQueue';

// Re-export convenience functions
export const initializeIoT = async (config?: {
  localServerUrl?: string;
  mqttBrokerUrl?: string;
  maxBleConnections?: number;
}) => {
  const { DeviceManager } = await import('./DeviceManager');
  const { OfflineSyncQueue } = await import('./OfflineSyncQueue');
  
  const deviceMgr = DeviceManager.getInstance(config);
  const syncQueue = OfflineSyncQueue.getInstance();
  
  return { deviceManager: deviceMgr, syncQueue };
};


