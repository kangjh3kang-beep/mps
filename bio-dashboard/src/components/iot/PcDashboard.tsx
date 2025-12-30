'use client';

/**
 * ============================================================
 * PC DASHBOARD - Multi-Device Control Tower
 * High-density grid view for managing 50+ sensors
 * ============================================================
 * 
 * Features:
 * - Grid view of all connected devices
 * - Bulk operations (calibrate all, start all, etc.)
 * - Real-time status monitoring
 * - Keyboard shortcuts for power users
 * - Data export station
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Battery,
  BatteryLow,
  BatteryCharging,
  Signal,
  SignalLow,
  SignalZero,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Square,
  Settings,
  Download,
  Upload,
  Search,
  Grid3X3,
  List,
  LayoutGrid,
  Maximize2,
  Minimize2,
  User,
  Users,
  Sliders,
  Zap,
  Cloud,
  CloudOff,
  Server,
  Radio,
} from 'lucide-react';

import {
  DeviceManager,
  deviceManager,
  DeviceInfo,
  DeviceStatus,
  ConnectionType,
  NetworkMode,
  CommandType,
} from '@/lib/iot/DeviceManager';

import { offlineSyncQueue, SyncStats } from '@/lib/iot/OfflineSyncQueue';

// ============================================
// TYPES
// ============================================

type ViewMode = 'grid' | 'list' | 'compact';

interface FilterOptions {
  status: DeviceStatus | 'all';
  connectionType: ConnectionType | 'all';
  search: string;
}

// ============================================
// SUB-COMPONENTS
// ============================================

// Connection Status Indicator
const ConnectivityStatus: React.FC<{
  networkMode: NetworkMode;
  syncStats?: SyncStats;
}> = ({ networkMode, syncStats }) => {
  const getStatusConfig = () => {
    switch (networkMode) {
      case NetworkMode.CLOUD:
        return {
          icon: Cloud,
          label: '클라우드 연결',
          color: 'text-green-500',
          bg: 'bg-green-100 dark:bg-green-900/30',
        };
      case NetworkMode.LOCAL_SERVER:
        return {
          icon: Server,
          label: '로컬 서버',
          color: 'text-blue-500',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
        };
      case NetworkMode.DIRECT:
        return {
          icon: Radio,
          label: 'Wi-Fi 다이렉트',
          color: 'text-amber-500',
          bg: 'bg-amber-100 dark:bg-amber-900/30',
        };
      case NetworkMode.OFFLINE:
        return {
          icon: CloudOff,
          label: '오프라인 모드',
          color: 'text-red-500',
          bg: 'bg-red-100 dark:bg-red-900/30',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
      <Icon className={`w-5 h-5 ${config.color}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        {syncStats && syncStats.pending > 0 && (
          <span className="text-xs text-muted-foreground">
            {syncStats.pending}개 동기화 대기 중
          </span>
        )}
      </div>
    </div>
  );
};

// Device Tile Component
const DeviceTile: React.FC<{
  device: DeviceInfo;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onAction: (id: string, action: CommandType) => void;
  compact?: boolean;
}> = ({ device, isSelected, onSelect, onAction, compact = false }) => {
  const getStatusIcon = () => {
    switch (device.status) {
      case DeviceStatus.ONLINE:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case DeviceStatus.MEASURING:
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case DeviceStatus.CALIBRATING:
        return <Sliders className="w-4 h-4 text-purple-500 animate-pulse" />;
      case DeviceStatus.ERROR:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case DeviceStatus.LOW_BATTERY:
        return <BatteryLow className="w-4 h-4 text-amber-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionIcon = () => {
    switch (device.connectionType) {
      case ConnectionType.BLUETOOTH:
        return <Bluetooth className="w-3 h-3 text-blue-400" />;
      case ConnectionType.WIFI_DIRECT:
      case ConnectionType.WIFI_LAN:
        return <Wifi className="w-3 h-3 text-green-400" />;
      case ConnectionType.SOFT_AP:
        return <Radio className="w-3 h-3 text-amber-400" />;
      default:
        return <WifiOff className="w-3 h-3 text-gray-400" />;
    }
  };

  const getBatteryIcon = () => {
    if (device.batteryLevel < 20) {
      return <BatteryLow className="w-4 h-4 text-red-500" />;
    }
    return <Battery className="w-4 h-4 text-green-500" />;
  };

  const getSignalStrength = () => {
    const rssi = device.signalStrength;
    if (rssi > -50) return <Signal className="w-4 h-4 text-green-500" />;
    if (rssi > -70) return <SignalLow className="w-4 h-4 text-amber-500" />;
    return <SignalZero className="w-4 h-4 text-red-500" />;
  };

  if (compact) {
    return (
      <div
        onClick={() => onSelect(device.id)}
        className={`p-2 rounded-lg border cursor-pointer transition-all ${
          isSelected 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50 bg-card'
        }`}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs font-medium truncate">{device.name}</span>
          {getConnectionIcon()}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => onSelect(device.id)}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/10 shadow-lg' 
          : 'border-border hover:border-primary/50 bg-card hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium truncate">{device.name}</span>
        </div>
        {getConnectionIcon()}
      </div>

      {/* Serial Number */}
      <p className="text-xs text-muted-foreground mb-3 font-mono">
        {device.serialNumber}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1 text-sm">
          {getBatteryIcon()}
          <span>{device.batteryLevel}%</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          {getSignalStrength()}
          <span>{device.signalStrength} dBm</span>
        </div>
      </div>

      {/* Assigned User */}
      {device.assignedUserName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <User className="w-3 h-3" />
          <span className="truncate">{device.assignedUserName}</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={(e) => { e.stopPropagation(); onAction(device.id, CommandType.START_MEASUREMENT); }}
          disabled={device.status !== DeviceStatus.ONLINE}
          className="flex-1 py-1.5 px-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <Play className="w-3 h-3 inline mr-1" />
          측정
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAction(device.id, CommandType.CALIBRATE); }}
          disabled={device.status !== DeviceStatus.ONLINE}
          className="flex-1 py-1.5 px-2 text-xs bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50"
        >
          <Sliders className="w-3 h-3 inline mr-1" />
          교정
        </button>
      </div>
    </motion.div>
  );
};

// Device List Row Component
const DeviceListRow: React.FC<{
  device: DeviceInfo;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onAction: (id: string, action: CommandType) => void;
}> = ({ device, isSelected, onSelect, onAction }) => {
  const getStatusBadge = () => {
    const statusConfig: Record<DeviceStatus, { color: string; label: string }> = {
      [DeviceStatus.ONLINE]: { color: 'bg-green-100 text-green-800', label: '온라인' },
      [DeviceStatus.OFFLINE]: { color: 'bg-gray-100 text-gray-800', label: '오프라인' },
      [DeviceStatus.CONNECTING]: { color: 'bg-blue-100 text-blue-800', label: '연결 중' },
      [DeviceStatus.MEASURING]: { color: 'bg-purple-100 text-purple-800', label: '측정 중' },
      [DeviceStatus.CALIBRATING]: { color: 'bg-amber-100 text-amber-800', label: '교정 중' },
      [DeviceStatus.ERROR]: { color: 'bg-red-100 text-red-800', label: '오류' },
      [DeviceStatus.LOW_BATTERY]: { color: 'bg-orange-100 text-orange-800', label: '배터리 부족' },
    };

    const config = statusConfig[device.status];
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <tr
      onClick={() => onSelect(device.id)}
      className={`border-b cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
      }`}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(device.id)}
          className="rounded border-border"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium">{device.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{device.serialNumber}</span>
        </div>
      </td>
      <td className="px-4 py-3">{getStatusBadge()}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Battery className={`w-4 h-4 ${device.batteryLevel < 20 ? 'text-red-500' : 'text-green-500'}`} />
          <span>{device.batteryLevel}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {device.connectionType === ConnectionType.BLUETOOTH ? 'BLE' : 'Wi-Fi'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm">{device.assignedUserName || '-'}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {device.measurementCount}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onAction(device.id, CommandType.START_MEASUREMENT); }}
            className="p-1.5 rounded hover:bg-muted"
            title="측정 시작"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAction(device.id, CommandType.CALIBRATE); }}
            className="p-1.5 rounded hover:bg-muted"
            title="교정"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAction(device.id, CommandType.GET_STATUS); }}
            className="p-1.5 rounded hover:bg-muted"
            title="상태 갱신"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const PcDashboard: React.FC = () => {
  // State
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [networkMode, setNetworkMode] = useState<NetworkMode>(NetworkMode.CLOUD);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isScanning, setIsScanning] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    connectionType: 'all',
    search: '',
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    // Subscribe to device manager events
    const handleDeviceUpdate = () => {
      setDevices(deviceManager.getAllDevices());
    };

    const handleNetworkChange = (mode: NetworkMode) => {
      setNetworkMode(mode);
    };

    deviceManager.on('deviceConnected', handleDeviceUpdate);
    deviceManager.on('deviceDisconnected', handleDeviceUpdate);
    deviceManager.on('deviceOffline', handleDeviceUpdate);
    deviceManager.on('networkModeChanged', handleNetworkChange);

    // Initial load
    setDevices(deviceManager.getAllDevices());
    setNetworkMode(deviceManager.getNetworkMode());

    // Load sync stats
    const loadSyncStats = async () => {
      const stats = await offlineSyncQueue.getStats();
      setSyncStats(stats);
    };
    loadSyncStats();

    // Cleanup
    return () => {
      deviceManager.off('deviceConnected', handleDeviceUpdate);
      deviceManager.off('deviceDisconnected', handleDeviceUpdate);
      deviceManager.off('deviceOffline', handleDeviceUpdate);
      deviceManager.off('networkModeChanged', handleNetworkChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space: Start measurement on selected devices
      if (e.code === 'Space' && selectedDevices.size > 0) {
        e.preventDefault();
        handleBulkAction(CommandType.START_MEASUREMENT);
      }
      
      // Ctrl + A: Select all
      if (e.ctrlKey && e.code === 'KeyA') {
        e.preventDefault();
        setSelectedDevices(new Set(devices.map(d => d.id)));
      }
      
      // Escape: Clear selection
      if (e.code === 'Escape') {
        setSelectedDevices(new Set());
      }
      
      // Ctrl + 1/2/3: Switch view mode
      if (e.ctrlKey && e.code === 'Digit1') {
        e.preventDefault();
        setViewMode('grid');
      }
      if (e.ctrlKey && e.code === 'Digit2') {
        e.preventDefault();
        setViewMode('list');
      }
      if (e.ctrlKey && e.code === 'Digit3') {
        e.preventDefault();
        setViewMode('compact');
      }
      
      // F11: Toggle fullscreen
      if (e.code === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDevices, devices]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelectDevice = useCallback((deviceId: string) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedDevices.size === filteredDevices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(filteredDevices.map(d => d.id)));
    }
  }, [selectedDevices.size]);

  const handleDeviceAction = useCallback(async (deviceId: string, action: CommandType) => {
    await deviceManager.sendCommand({
      type: action,
      deviceIds: [deviceId],
    });
  }, []);

  const handleBulkAction = useCallback(async (action: CommandType) => {
    if (selectedDevices.size === 0) return;
    
    await deviceManager.sendCommand({
      type: action,
      deviceIds: Array.from(selectedDevices),
    });
  }, [selectedDevices]);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      await deviceManager.scanBluetooth();
      await deviceManager.scanWifi();
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    const csv = deviceManager.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mps_devices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleSync = useCallback(async () => {
    await offlineSyncQueue.sync();
    const stats = await offlineSyncQueue.getStats();
    setSyncStats(stats);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      // Status filter
      if (filters.status !== 'all' && device.status !== filters.status) {
        return false;
      }
      
      // Connection type filter
      if (filters.connectionType !== 'all' && device.connectionType !== filters.connectionType) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          device.name.toLowerCase().includes(search) ||
          device.serialNumber.toLowerCase().includes(search) ||
          device.assignedUserName?.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  }, [devices, filters]);

  const deviceStats = useMemo(() => {
    return deviceManager.getDeviceCount();
  }, [devices]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">디바이스 관리 센터</h1>
            <ConnectivityStatus networkMode={networkMode} syncStats={syncStats || undefined} />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mr-4">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {deviceStats.total}대
              </span>
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="w-4 h-4" />
                {deviceStats.online}
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <XCircle className="w-4 h-4" />
                {deviceStats.offline}
              </span>
            </div>
            
            {/* Actions */}
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              스캔
            </button>
            
            <button
              onClick={handleSync}
              className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg flex items-center gap-2 hover:bg-secondary/90"
            >
              <Upload className="w-4 h-4" />
              동기화
            </button>
            
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg flex items-center gap-2 hover:bg-secondary/90"
            >
              <Download className="w-4 h-4" />
              내보내기
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-muted"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-border p-3 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="검색..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as FilterOptions['status'] }))}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="all">모든 상태</option>
            <option value={DeviceStatus.ONLINE}>온라인</option>
            <option value={DeviceStatus.OFFLINE}>오프라인</option>
            <option value={DeviceStatus.MEASURING}>측정 중</option>
            <option value={DeviceStatus.ERROR}>오류</option>
          </select>
          
          {/* Connection Type Filter */}
          <select
            value={filters.connectionType}
            onChange={(e) => setFilters(f => ({ ...f, connectionType: e.target.value as FilterOptions['connectionType'] }))}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="all">모든 연결</option>
            <option value={ConnectionType.BLUETOOTH}>Bluetooth</option>
            <option value={ConnectionType.WIFI_LAN}>Wi-Fi</option>
            <option value={ConnectionType.SOFT_AP}>Soft-AP</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          {selectedDevices.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-muted-foreground">
                {selectedDevices.size}개 선택됨
              </span>
              <button
                onClick={() => handleBulkAction(CommandType.START_MEASUREMENT)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <Play className="w-4 h-4 inline mr-1" />
                모두 측정
              </button>
              <button
                onClick={() => handleBulkAction(CommandType.CALIBRATE)}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
              >
                <Sliders className="w-4 h-4 inline mr-1" />
                모두 교정
              </button>
              <button
                onClick={() => handleBulkAction(CommandType.STOP_MEASUREMENT)}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                <Square className="w-4 h-4 inline mr-1" />
                모두 중지
              </button>
            </div>
          )}
          
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title="그리드 뷰 (Ctrl+1)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title="리스트 뷰 (Ctrl+2)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 ${viewMode === 'compact' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title="컴팩트 뷰 (Ctrl+3)"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">연결된 디바이스가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              스캔 버튼을 클릭하여 주변 MPS 리더기를 검색하세요.
            </p>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              디바이스 스캔
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDevices.size === filteredDevices.length}
                    onChange={handleSelectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">디바이스</th>
                <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium">배터리</th>
                <th className="px-4 py-3 text-left text-sm font-medium">연결</th>
                <th className="px-4 py-3 text-left text-sm font-medium">사용자</th>
                <th className="px-4 py-3 text-left text-sm font-medium">측정 횟수</th>
                <th className="px-4 py-3 text-left text-sm font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map(device => (
                <DeviceListRow
                  key={device.id}
                  device={device}
                  isSelected={selectedDevices.has(device.id)}
                  onSelect={handleSelectDevice}
                  onAction={handleDeviceAction}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <div className={`grid gap-4 ${
            viewMode === 'compact'
              ? 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
          }`}>
            <AnimatePresence>
              {filteredDevices.map(device => (
                <DeviceTile
                  key={device.id}
                  device={device}
                  isSelected={selectedDevices.has(device.id)}
                  onSelect={handleSelectDevice}
                  onAction={handleDeviceAction}
                  compact={viewMode === 'compact'}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer / Keyboard Shortcuts */}
      <footer className="border-t border-border p-2 bg-muted/30">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">Space</kbd> 측정 시작</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+A</kbd> 전체 선택</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> 선택 해제</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+1/2/3</kbd> 뷰 전환</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">F11</kbd> 전체화면</span>
        </div>
      </footer>
    </div>
  );
};

export default PcDashboard;


