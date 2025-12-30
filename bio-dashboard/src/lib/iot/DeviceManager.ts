/**
 * ============================================================
 * DEVICE MANAGER - Multi-Device Connectivity Core
 * IoT Mesh Connection Architecture for 50+ Concurrent Devices
 * ============================================================
 * 
 * Core Philosophy: "Unbreakable Connection"
 * - Many-to-One: One User/PC can control 50+ Readers
 * - No Internet, No Problem: Works via Wi-Fi Direct or Local LAN
 * 
 * Supported Protocols:
 * - Web Bluetooth API (BLE) - Max 5-7 simultaneous connections
 * - MQTT over WebSocket - For Wi-Fi mesh
 * - UDP Multicast - For subnet discovery
 * - Soft-AP Mode - Reader as hotspot (offline)
 */

import { EventEmitter } from 'events';

// ============================================
// TYPES & INTERFACES
// ============================================

export enum ConnectionType {
  BLUETOOTH = 'bluetooth',
  WIFI_DIRECT = 'wifi_direct',
  WIFI_LAN = 'wifi_lan',
  SOFT_AP = 'soft_ap',
  USB = 'usb',
  DISCONNECTED = 'disconnected',
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting',
  MEASURING = 'measuring',
  CALIBRATING = 'calibrating',
  ERROR = 'error',
  LOW_BATTERY = 'low_battery',
}

export enum NetworkMode {
  CLOUD = 'cloud',           // Full internet connectivity
  LOCAL_SERVER = 'local',    // On-premise server
  DIRECT = 'direct',         // Wi-Fi Direct / Soft-AP
  OFFLINE = 'offline',       // No network, local processing only
}

export interface DeviceInfo {
  id: string;
  serialNumber: string;
  name: string;
  model: string;
  firmwareVersion: string;
  
  // Connection
  connectionType: ConnectionType;
  signalStrength: number; // -100 to 0 dBm for RSSI, 0-100% for others
  ipAddress?: string;
  macAddress?: string;
  
  // Status
  status: DeviceStatus;
  batteryLevel: number;
  lastSeen: number;
  lastMeasurement?: number;
  
  // User assignment
  assignedUserId?: string;
  assignedUserName?: string;
  
  // Capabilities
  capabilities: DeviceCapability[];
  
  // Metrics
  measurementCount: number;
  errorCount: number;
  uptime: number;
}

export enum DeviceCapability {
  GLUCOSE = 'glucose',
  LACTATE = 'lactate',
  KETONE = 'ketone',
  MULTI_ANALYTE = 'multi_analyte',
  CONTINUOUS_MONITORING = 'continuous',
  OTA_UPDATE = 'ota_update',
}

export interface DeviceCommand {
  type: CommandType;
  deviceIds: string[];
  params?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  timeout?: number;
}

export enum CommandType {
  START_MEASUREMENT = 'start_measurement',
  STOP_MEASUREMENT = 'stop_measurement',
  CALIBRATE = 'calibrate',
  GET_STATUS = 'get_status',
  SET_CONFIG = 'set_config',
  RESTART = 'restart',
  FIRMWARE_UPDATE = 'firmware_update',
  ENTER_SLEEP = 'enter_sleep',
  WAKE_UP = 'wake_up',
}

export interface CommandResult {
  deviceId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: number;
  latencyMs: number;
}

export interface DiscoveredDevice {
  id: string;
  name: string;
  type: ConnectionType;
  rssi?: number;
  services?: string[];
  isPaired: boolean;
}

export interface DeviceManagerConfig {
  maxBleConnections: number;
  scanTimeout: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  mqttBrokerUrl?: string;
  localServerUrl?: string;
  enableUdpDiscovery: boolean;
  udpDiscoveryPort: number;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_CONFIG: DeviceManagerConfig = {
  maxBleConnections: 7,
  scanTimeout: 10000,
  reconnectAttempts: 3,
  reconnectDelay: 2000,
  heartbeatInterval: 5000,
  enableUdpDiscovery: true,
  udpDiscoveryPort: 5353,
};

const BLE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb'; // Heart Rate (placeholder)
const MPS_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0'; // Custom MPS Service

// ============================================
// DEVICE MANAGER SINGLETON
// ============================================

export class DeviceManager extends EventEmitter {
  private static instance: DeviceManager | null = null;
  
  private config: DeviceManagerConfig;
  private devices: Map<string, DeviceInfo> = new Map();
  private bleConnections: Map<string, BluetoothDevice> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();
  
  private networkMode: NetworkMode = NetworkMode.CLOUD;
  private isScanning: boolean = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectQueue: Map<string, number> = new Map();
  
  // Device groups for bulk operations
  private deviceGroups: Map<string, Set<string>> = new Map();
  
  private constructor(config: Partial<DeviceManagerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  public static getInstance(config?: Partial<DeviceManagerConfig>): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager(config);
    }
    return DeviceManager.instance;
  }

  public static resetInstance(): void {
    if (DeviceManager.instance) {
      DeviceManager.instance.destroy();
      DeviceManager.instance = null;
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private async initialize(): Promise<void> {
    // Check network mode
    await this.detectNetworkMode();
    
    // Start heartbeat monitoring
    this.startHeartbeatMonitor();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
    
    this.emit('initialized', { networkMode: this.networkMode });
  }

  private destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // Disconnect all devices
    this.disconnectAll();
    
    this.removeAllListeners();
  }

  // ============================================
  // NETWORK MODE DETECTION
  // ============================================

  private async detectNetworkMode(): Promise<void> {
    // Check if we're online
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    if (!isOnline) {
      this.networkMode = NetworkMode.OFFLINE;
      this.emit('networkModeChanged', this.networkMode);
      return;
    }
    
    // Try to reach cloud server
    try {
      const cloudResponse = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-store',
      });
      
      if (cloudResponse.ok) {
        this.networkMode = NetworkMode.CLOUD;
        this.emit('networkModeChanged', this.networkMode);
        return;
      }
    } catch {
      // Cloud unreachable
    }
    
    // Try local server
    if (this.config.localServerUrl) {
      try {
        const localResponse = await fetch(`${this.config.localServerUrl}/health`, {
          method: 'HEAD',
          cache: 'no-store',
        });
        
        if (localResponse.ok) {
          this.networkMode = NetworkMode.LOCAL_SERVER;
          this.emit('networkModeChanged', this.networkMode);
          return;
        }
      } catch {
        // Local server unreachable
      }
    }
    
    // Default to direct mode
    this.networkMode = NetworkMode.DIRECT;
    this.emit('networkModeChanged', this.networkMode);
  }

  private handleNetworkChange(isOnline: boolean): void {
    if (isOnline) {
      this.detectNetworkMode();
    } else {
      this.networkMode = NetworkMode.OFFLINE;
      this.emit('networkModeChanged', this.networkMode);
    }
  }

  public getNetworkMode(): NetworkMode {
    return this.networkMode;
  }

  public setNetworkMode(mode: NetworkMode): void {
    this.networkMode = mode;
    this.emit('networkModeChanged', mode);
  }

  // ============================================
  // BLUETOOTH SCANNING & CONNECTION
  // ============================================

  public async scanBluetooth(duration: number = this.config.scanTimeout): Promise<DiscoveredDevice[]> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth API not supported');
    }
    
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }
    
    this.isScanning = true;
    this.emit('scanStarted', { type: 'bluetooth' });
    
    const discovered: DiscoveredDevice[] = [];
    
    try {
      // Request device with filters
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'MPS' },
          { services: [BLE_SERVICE_UUID] },
        ],
        optionalServices: [MPS_SERVICE_UUID],
      });
      
      if (device) {
        discovered.push({
          id: device.id,
          name: device.name || 'Unknown MPS Device',
          type: ConnectionType.BLUETOOTH,
          isPaired: device.gatt?.connected || false,
        });
        
        this.emit('deviceDiscovered', discovered[0]);
      }
    } catch (error) {
      if ((error as Error).name !== 'NotFoundError') {
        throw error;
      }
    } finally {
      this.isScanning = false;
      this.emit('scanCompleted', { discovered });
    }
    
    return discovered;
  }

  public async connectBluetooth(deviceId: string): Promise<DeviceInfo> {
    const bleDevice = this.bleConnections.get(deviceId);
    
    if (!bleDevice) {
      throw new Error(`Bluetooth device ${deviceId} not found. Scan first.`);
    }
    
    // Check connection limit
    const activeConnections = Array.from(this.bleConnections.values())
      .filter(d => d.gatt?.connected).length;
    
    if (activeConnections >= this.config.maxBleConnections) {
      throw new Error(`Maximum BLE connections (${this.config.maxBleConnections}) reached. Use Wi-Fi for more devices.`);
    }
    
    try {
      const gatt = await bleDevice.gatt!.connect();
      
      // Get device info from characteristics
      const deviceInfo = await this.readDeviceInfo(gatt, deviceId, bleDevice.name || 'MPS Device');
      
      this.devices.set(deviceId, deviceInfo);
      this.emit('deviceConnected', deviceInfo);
      
      // Set up disconnect handler
      bleDevice.addEventListener('gattserverdisconnected', () => {
        this.handleDeviceDisconnect(deviceId);
      });
      
      return deviceInfo;
    } catch (error) {
      this.emit('connectionError', { deviceId, error });
      throw error;
    }
  }

  private async readDeviceInfo(
    gatt: BluetoothRemoteGATTServer,
    deviceId: string,
    name: string
  ): Promise<DeviceInfo> {
    // In production, read actual characteristics
    // For now, return mock data structure
    return {
      id: deviceId,
      serialNumber: `MPS-${deviceId.slice(-8).toUpperCase()}`,
      name,
      model: 'MPS Reader Pro',
      firmwareVersion: '2.1.0',
      connectionType: ConnectionType.BLUETOOTH,
      signalStrength: -50,
      status: DeviceStatus.ONLINE,
      batteryLevel: 85,
      lastSeen: Date.now(),
      capabilities: [DeviceCapability.GLUCOSE, DeviceCapability.LACTATE],
      measurementCount: 0,
      errorCount: 0,
      uptime: 0,
    };
  }

  // ============================================
  // WI-FI DISCOVERY & CONNECTION
  // ============================================

  public async scanWifi(): Promise<DiscoveredDevice[]> {
    this.isScanning = true;
    this.emit('scanStarted', { type: 'wifi' });
    
    const discovered: DiscoveredDevice[] = [];
    
    try {
      // UDP Multicast Discovery (mDNS/DNS-SD style)
      if (this.config.enableUdpDiscovery) {
        // In browser, we use HTTP-based discovery endpoint
        const response = await fetch('/api/devices/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeout: this.config.scanTimeout }),
        });
        
        if (response.ok) {
          const { devices } = await response.json();
          discovered.push(...devices);
        }
      }
      
      // Also check for Soft-AP networks (MPS_READER_*)
      // This would require native app capabilities
      
    } catch (error) {
      this.emit('scanError', error);
    } finally {
      this.isScanning = false;
      this.emit('scanCompleted', { discovered });
    }
    
    return discovered;
  }

  public async connectWifi(deviceId: string, ipAddress: string): Promise<DeviceInfo> {
    try {
      // Connect via WebSocket for real-time communication
      const wsUrl = `ws://${ipAddress}:8080/mps`;
      const ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, this.config.scanTimeout);
        
        ws.onopen = async () => {
          clearTimeout(timeout);
          
          this.wsConnections.set(deviceId, ws);
          
          // Request device info
          ws.send(JSON.stringify({ type: 'GET_INFO' }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'DEVICE_INFO') {
            const deviceInfo: DeviceInfo = {
              id: deviceId,
              serialNumber: data.serialNumber,
              name: data.name,
              model: data.model,
              firmwareVersion: data.firmwareVersion,
              connectionType: ConnectionType.WIFI_LAN,
              signalStrength: data.rssi || 100,
              ipAddress,
              status: DeviceStatus.ONLINE,
              batteryLevel: data.batteryLevel,
              lastSeen: Date.now(),
              capabilities: data.capabilities || [],
              measurementCount: 0,
              errorCount: 0,
              uptime: data.uptime || 0,
            };
            
            this.devices.set(deviceId, deviceInfo);
            this.emit('deviceConnected', deviceInfo);
            resolve(deviceInfo);
          }
        };
        
        ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
        
        ws.onclose = () => {
          this.handleDeviceDisconnect(deviceId);
        };
      });
    } catch (error) {
      this.emit('connectionError', { deviceId, error });
      throw error;
    }
  }

  // ============================================
  // SOFT-AP MODE (Offline Direct Connection)
  // ============================================

  public async connectSoftAP(ssid: string): Promise<DeviceInfo> {
    // Extract device ID from SSID (e.g., MPS_READER_ABC123)
    const match = ssid.match(/MPS_READER_([A-Z0-9]+)/);
    if (!match) {
      throw new Error('Invalid MPS Soft-AP SSID');
    }
    
    const deviceId = match[1];
    
    // In Soft-AP mode, the reader is at a fixed IP
    const softApIp = '192.168.4.1';
    
    try {
      const deviceInfo = await this.connectWifi(deviceId, softApIp);
      deviceInfo.connectionType = ConnectionType.SOFT_AP;
      
      // Set network mode to direct
      this.networkMode = NetworkMode.DIRECT;
      this.emit('networkModeChanged', this.networkMode);
      
      return deviceInfo;
    } catch (error) {
      this.emit('connectionError', { deviceId, error });
      throw error;
    }
  }

  // ============================================
  // DEVICE MANAGEMENT
  // ============================================

  public getDevice(deviceId: string): DeviceInfo | undefined {
    return this.devices.get(deviceId);
  }

  public getAllDevices(): DeviceInfo[] {
    return Array.from(this.devices.values());
  }

  public getOnlineDevices(): DeviceInfo[] {
    return this.getAllDevices().filter(d => 
      d.status === DeviceStatus.ONLINE || 
      d.status === DeviceStatus.MEASURING
    );
  }

  public getDevicesByStatus(status: DeviceStatus): DeviceInfo[] {
    return this.getAllDevices().filter(d => d.status === status);
  }

  public getDeviceCount(): { total: number; online: number; offline: number } {
    const devices = this.getAllDevices();
    const online = devices.filter(d => 
      d.status === DeviceStatus.ONLINE || 
      d.status === DeviceStatus.MEASURING
    ).length;
    
    return {
      total: devices.length,
      online,
      offline: devices.length - online,
    };
  }

  // ============================================
  // DEVICE GROUPS (For Bulk Operations)
  // ============================================

  public createGroup(groupId: string, deviceIds: string[]): void {
    this.deviceGroups.set(groupId, new Set(deviceIds));
    this.emit('groupCreated', { groupId, deviceIds });
  }

  public addToGroup(groupId: string, deviceId: string): void {
    const group = this.deviceGroups.get(groupId) || new Set();
    group.add(deviceId);
    this.deviceGroups.set(groupId, group);
  }

  public removeFromGroup(groupId: string, deviceId: string): void {
    const group = this.deviceGroups.get(groupId);
    if (group) {
      group.delete(deviceId);
    }
  }

  public getGroup(groupId: string): string[] {
    const group = this.deviceGroups.get(groupId);
    return group ? Array.from(group) : [];
  }

  public deleteGroup(groupId: string): void {
    this.deviceGroups.delete(groupId);
  }

  // ============================================
  // COMMAND EXECUTION
  // ============================================

  public async sendCommand(command: DeviceCommand): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    const { deviceIds, type, params, timeout = 5000 } = command;
    
    this.emit('commandStarted', command);
    
    for (const deviceId of deviceIds) {
      const startTime = Date.now();
      
      try {
        const device = this.devices.get(deviceId);
        if (!device) {
          throw new Error('Device not found');
        }
        
        // Route command based on connection type
        const data = await this.executeDeviceCommand(deviceId, type, params, timeout);
        
        results.push({
          deviceId,
          success: true,
          data,
          timestamp: Date.now(),
          latencyMs: Date.now() - startTime,
        });
        
        this.emit('commandSuccess', { deviceId, type, data });
        
      } catch (error) {
        results.push({
          deviceId,
          success: false,
          error: (error as Error).message,
          timestamp: Date.now(),
          latencyMs: Date.now() - startTime,
        });
        
        this.emit('commandError', { deviceId, type, error });
      }
    }
    
    this.emit('commandCompleted', { command, results });
    return results;
  }

  private async executeDeviceCommand(
    deviceId: string,
    type: CommandType,
    params?: Record<string, unknown>,
    timeout: number = 5000
  ): Promise<unknown> {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error('Device not found');
    
    const message = JSON.stringify({ type, params, requestId: Date.now() });
    
    // BLE Command
    if (device.connectionType === ConnectionType.BLUETOOTH) {
      const bleDevice = this.bleConnections.get(deviceId);
      if (!bleDevice?.gatt?.connected) {
        throw new Error('BLE device not connected');
      }
      
      // Write to characteristic and wait for notification
      // Implementation depends on actual BLE protocol
      return { success: true }; // Placeholder
    }
    
    // WebSocket Command
    const ws = this.wsConnections.get(deviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Command timeout'));
        }, timeout);
        
        const handler = (event: MessageEvent) => {
          const response = JSON.parse(event.data);
          if (response.type === `${type}_RESPONSE`) {
            clearTimeout(timeoutId);
            ws.removeEventListener('message', handler);
            resolve(response.data);
          }
        };
        
        ws.addEventListener('message', handler);
        ws.send(message);
      });
    }
    
    throw new Error('No active connection');
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  public async calibrateAll(deviceIds?: string[]): Promise<CommandResult[]> {
    const targets = deviceIds || Array.from(this.devices.keys());
    
    return this.sendCommand({
      type: CommandType.CALIBRATE,
      deviceIds: targets,
      priority: 'high',
    });
  }

  public async startMeasurementAll(deviceIds?: string[]): Promise<CommandResult[]> {
    const targets = deviceIds || Array.from(this.devices.keys());
    
    return this.sendCommand({
      type: CommandType.START_MEASUREMENT,
      deviceIds: targets,
    });
  }

  public async stopMeasurementAll(deviceIds?: string[]): Promise<CommandResult[]> {
    const targets = deviceIds || Array.from(this.devices.keys());
    
    return this.sendCommand({
      type: CommandType.STOP_MEASUREMENT,
      deviceIds: targets,
      priority: 'high',
    });
  }

  public async getStatusAll(): Promise<CommandResult[]> {
    const targets = Array.from(this.devices.keys());
    
    return this.sendCommand({
      type: CommandType.GET_STATUS,
      deviceIds: targets,
    });
  }

  // ============================================
  // DISCONNECT & CLEANUP
  // ============================================

  public async disconnect(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;
    
    // Disconnect BLE
    const bleDevice = this.bleConnections.get(deviceId);
    if (bleDevice?.gatt?.connected) {
      bleDevice.gatt.disconnect();
    }
    this.bleConnections.delete(deviceId);
    
    // Disconnect WebSocket
    const ws = this.wsConnections.get(deviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    this.wsConnections.delete(deviceId);
    
    this.handleDeviceDisconnect(deviceId);
  }

  public async disconnectAll(): Promise<void> {
    const deviceIds = Array.from(this.devices.keys());
    await Promise.all(deviceIds.map(id => this.disconnect(id)));
  }

  private handleDeviceDisconnect(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = DeviceStatus.OFFLINE;
      device.connectionType = ConnectionType.DISCONNECTED;
      this.emit('deviceDisconnected', device);
      
      // Schedule reconnect attempt
      this.scheduleReconnect(deviceId);
    }
  }

  private scheduleReconnect(deviceId: string): void {
    const attempts = this.reconnectQueue.get(deviceId) || 0;
    
    if (attempts < this.config.reconnectAttempts) {
      this.reconnectQueue.set(deviceId, attempts + 1);
      
      setTimeout(async () => {
        try {
          // Try to reconnect based on last known connection type
          const device = this.devices.get(deviceId);
          if (device?.ipAddress) {
            await this.connectWifi(deviceId, device.ipAddress);
          }
          this.reconnectQueue.delete(deviceId);
        } catch {
          // Will retry again if attempts remain
        }
      }, this.config.reconnectDelay * (attempts + 1));
    }
  }

  // ============================================
  // HEARTBEAT MONITORING
  // ============================================

  private startHeartbeatMonitor(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkDeviceHealth();
    }, this.config.heartbeatInterval);
  }

  private async checkDeviceHealth(): Promise<void> {
    const now = Date.now();
    
    for (const [deviceId, device] of this.devices) {
      const timeSinceLastSeen = now - device.lastSeen;
      
      // Mark as offline if no heartbeat for 3 intervals
      if (timeSinceLastSeen > this.config.heartbeatInterval * 3) {
        if (device.status !== DeviceStatus.OFFLINE) {
          device.status = DeviceStatus.OFFLINE;
          this.emit('deviceOffline', device);
        }
      }
      
      // Check battery warnings
      if (device.batteryLevel < 10 && device.status !== DeviceStatus.LOW_BATTERY) {
        device.status = DeviceStatus.LOW_BATTERY;
        this.emit('lowBattery', device);
      }
    }
    
    // Ping all connected devices
    try {
      await this.getStatusAll();
    } catch {
      // Silent fail for heartbeat
    }
  }

  // ============================================
  // DATA EXPORT
  // ============================================

  public exportDeviceData(): Record<string, DeviceInfo> {
    const data: Record<string, DeviceInfo> = {};
    for (const [id, device] of this.devices) {
      data[id] = { ...device };
    }
    return data;
  }

  public exportToCSV(): string {
    const devices = this.getAllDevices();
    const headers = [
      'Serial Number',
      'Name',
      'Model',
      'Status',
      'Connection Type',
      'Battery Level',
      'Signal Strength',
      'IP Address',
      'Firmware Version',
      'Last Seen',
      'Measurement Count',
      'Assigned User',
    ];
    
    const rows = devices.map(d => [
      d.serialNumber,
      d.name,
      d.model,
      d.status,
      d.connectionType,
      d.batteryLevel,
      d.signalStrength,
      d.ipAddress || 'N/A',
      d.firmwareVersion,
      new Date(d.lastSeen).toISOString(),
      d.measurementCount,
      d.assignedUserName || 'Unassigned',
    ]);
    
    return [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const deviceManager = DeviceManager.getInstance();

export default DeviceManager;


