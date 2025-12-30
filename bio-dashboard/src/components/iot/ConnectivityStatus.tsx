'use client';

/**
 * ============================================================
 * CONNECTIVITY STATUS INDICATORS
 * Visual feedback for network and device connection states
 * ============================================================
 * 
 * Icon Set:
 * - Cloud Connected (Green cloud)
 * - Local Wi-Fi Only (Blue server)
 * - Wi-Fi Direct / Soft-AP (Amber radio)
 * - Bluetooth Only (Blue bluetooth)
 * - Offline (Red cloud-off)
 * 
 * Features:
 * - Animated transitions
 * - Sync queue status
 * - Real-time updates
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  CloudOff,
  Server,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  BluetoothSearching,
  Radio,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero,
  RefreshCw,
  Check,
  AlertTriangle,
  XCircle,
  Loader2,
} from 'lucide-react';

import { NetworkMode, ConnectionType } from '@/lib/iot/DeviceManager';

// ============================================
// TYPES
// ============================================

export interface ConnectivityStatusProps {
  networkMode: NetworkMode;
  pendingSync?: number;
  isOnline?: boolean;
  isSyncing?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface DeviceConnectionProps {
  connectionType: ConnectionType;
  signalStrength?: number;
  isConnecting?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface SyncStatusProps {
  pending: number;
  syncing: number;
  failed: number;
  isSyncing?: boolean;
  onSync?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const sizeMap = {
  sm: { icon: 'w-4 h-4', text: 'text-xs', badge: 'w-2 h-2', container: 'gap-1 px-2 py-1' },
  md: { icon: 'w-5 h-5', text: 'text-sm', badge: 'w-2.5 h-2.5', container: 'gap-2 px-3 py-2' },
  lg: { icon: 'w-6 h-6', text: 'text-base', badge: 'w-3 h-3', container: 'gap-2 px-4 py-2.5' },
};

// ============================================
// CONNECTIVITY STATUS (Network Mode)
// ============================================

export const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({
  networkMode,
  pendingSync = 0,
  isOnline = true,
  isSyncing = false,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const sizes = sizeMap[size];
  
  const getConfig = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        label: '오프라인',
        color: 'text-red-500',
        bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
        pulse: false,
      };
    }
    
    switch (networkMode) {
      case NetworkMode.CLOUD:
        return {
          icon: Cloud,
          label: '클라우드 연결',
          color: 'text-green-500',
          bg: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
          pulse: false,
        };
      case NetworkMode.LOCAL_SERVER:
        return {
          icon: Server,
          label: '로컬 서버',
          color: 'text-blue-500',
          bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
          pulse: false,
        };
      case NetworkMode.DIRECT:
        return {
          icon: Radio,
          label: 'Wi-Fi 다이렉트',
          color: 'text-amber-500',
          bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
          pulse: true,
        };
      case NetworkMode.OFFLINE:
        return {
          icon: CloudOff,
          label: '오프라인 모드',
          color: 'text-gray-500',
          bg: 'bg-gray-100 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800',
          pulse: false,
        };
    }
  };
  
  const config = getConfig();
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center ${sizes.container} rounded-lg border ${config.bg} ${className}`}
    >
      <div className="relative">
        <Icon className={`${sizes.icon} ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
        {isSyncing && (
          <motion.div
            className={`absolute -top-1 -right-1 ${sizes.badge} bg-blue-500 rounded-full`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
      
      {showLabel && (
        <div className="flex flex-col">
          <span className={`${sizes.text} font-medium ${config.color}`}>
            {config.label}
          </span>
          {pendingSync > 0 && (
            <span className={`${sizes.text} text-muted-foreground`}>
              {pendingSync}개 대기 중
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// DEVICE CONNECTION STATUS
// ============================================

export const DeviceConnectionStatus: React.FC<DeviceConnectionProps> = ({
  connectionType,
  signalStrength = 100,
  isConnecting = false,
  size = 'md',
  className = '',
}) => {
  const sizes = sizeMap[size];
  
  const getConfig = () => {
    if (isConnecting) {
      return {
        icon: connectionType === ConnectionType.BLUETOOTH ? BluetoothSearching : Wifi,
        color: 'text-blue-500',
        label: '연결 중...',
        animate: true,
      };
    }
    
    switch (connectionType) {
      case ConnectionType.BLUETOOTH:
        return {
          icon: BluetoothConnected,
          color: 'text-blue-500',
          label: 'Bluetooth',
          animate: false,
        };
      case ConnectionType.WIFI_DIRECT:
        return {
          icon: Radio,
          color: 'text-amber-500',
          label: 'Wi-Fi Direct',
          animate: false,
        };
      case ConnectionType.WIFI_LAN:
        return {
          icon: Wifi,
          color: 'text-green-500',
          label: 'Wi-Fi',
          animate: false,
        };
      case ConnectionType.SOFT_AP:
        return {
          icon: Radio,
          color: 'text-purple-500',
          label: 'Soft-AP',
          animate: true,
        };
      case ConnectionType.USB:
        return {
          icon: Signal,
          color: 'text-green-500',
          label: 'USB',
          animate: false,
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-400',
          label: '연결 안 됨',
          animate: false,
        };
    }
  };
  
  const getSignalIcon = () => {
    if (connectionType === ConnectionType.DISCONNECTED) {
      return SignalZero;
    }
    if (signalStrength > 70) return SignalHigh;
    if (signalStrength > 30) return SignalLow;
    return SignalZero;
  };
  
  const config = getConfig();
  const Icon = config.icon;
  const SignalIcon = getSignalIcon();
  
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <motion.div
        animate={config.animate ? { opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Icon className={`${sizes.icon} ${config.color}`} />
      </motion.div>
      
      {connectionType !== ConnectionType.DISCONNECTED && (
        <div className="flex items-center">
          <SignalIcon className={`${sizes.icon} ${
            signalStrength > 70 ? 'text-green-500' :
            signalStrength > 30 ? 'text-amber-500' : 'text-red-500'
          }`} />
        </div>
      )}
    </div>
  );
};

// ============================================
// SYNC STATUS INDICATOR
// ============================================

export const SyncStatus: React.FC<SyncStatusProps> = ({
  pending,
  syncing,
  failed,
  isSyncing = false,
  onSync,
  size = 'md',
  className = '',
}) => {
  const sizes = sizeMap[size];
  const hasData = pending > 0 || syncing > 0 || failed > 0;
  
  if (!hasData && !isSyncing) {
    return (
      <div className={`inline-flex items-center ${sizes.container} text-green-500 ${className}`}>
        <Check className={sizes.icon} />
        <span className={sizes.text}>동기화 완료</span>
      </div>
    );
  }
  
  return (
    <div className={`inline-flex items-center ${sizes.container} gap-3 ${className}`}>
      {/* Pending */}
      {pending > 0 && (
        <div className="flex items-center gap-1 text-amber-500">
          <div className={`${sizes.badge} rounded-full bg-amber-500`} />
          <span className={sizes.text}>{pending} 대기</span>
        </div>
      )}
      
      {/* Syncing */}
      {(syncing > 0 || isSyncing) && (
        <div className="flex items-center gap-1 text-blue-500">
          <Loader2 className={`${sizes.icon} animate-spin`} />
          <span className={sizes.text}>{syncing > 0 ? `${syncing} 동기화 중` : '동기화 중...'}</span>
        </div>
      )}
      
      {/* Failed */}
      {failed > 0 && (
        <div className="flex items-center gap-1 text-red-500">
          <XCircle className={sizes.icon} />
          <span className={sizes.text}>{failed} 실패</span>
        </div>
      )}
      
      {/* Manual Sync Button */}
      {onSync && !isSyncing && (
        <button
          onClick={onSync}
          className="p-1 rounded hover:bg-muted"
          title="수동 동기화"
        >
          <RefreshCw className={sizes.icon} />
        </button>
      )}
    </div>
  );
};

// ============================================
// NETWORK STATUS BAR
// ============================================

export interface NetworkStatusBarProps {
  networkMode: NetworkMode;
  isOnline: boolean;
  isSyncing: boolean;
  syncStats: {
    pending: number;
    syncing: number;
    failed: number;
  };
  onSync?: () => void;
  className?: string;
}

export const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({
  networkMode,
  isOnline,
  isSyncing,
  syncStats,
  onSync,
  className = '',
}) => {
  const showWarning = !isOnline || syncStats.failed > 0;
  
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`flex items-center justify-between px-4 py-2 rounded-lg ${
        showWarning
          ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
          : 'bg-muted/50'
      } ${className}`}
    >
      <div className="flex items-center gap-4">
        <ConnectivityStatus
          networkMode={networkMode}
          isOnline={isOnline}
          isSyncing={isSyncing}
          size="sm"
        />
        
        <SyncStatus
          pending={syncStats.pending}
          syncing={syncStats.syncing}
          failed={syncStats.failed}
          isSyncing={isSyncing}
          size="sm"
        />
      </div>
      
      {onSync && (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          동기화
        </button>
      )}
    </motion.div>
  );
};

// ============================================
// COMPACT CONNECTION BADGE
// ============================================

export interface ConnectionBadgeProps {
  connectionType: ConnectionType;
  isConnected?: boolean;
  className?: string;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  connectionType,
  isConnected = true,
  className = '',
}) => {
  const getConfig = () => {
    switch (connectionType) {
      case ConnectionType.BLUETOOTH:
        return { icon: Bluetooth, bg: 'bg-blue-500', label: 'BLE' };
      case ConnectionType.WIFI_LAN:
        return { icon: Wifi, bg: 'bg-green-500', label: 'WiFi' };
      case ConnectionType.WIFI_DIRECT:
        return { icon: Radio, bg: 'bg-amber-500', label: 'Direct' };
      case ConnectionType.SOFT_AP:
        return { icon: Radio, bg: 'bg-purple-500', label: 'AP' };
      case ConnectionType.USB:
        return { icon: Signal, bg: 'bg-gray-500', label: 'USB' };
      default:
        return { icon: WifiOff, bg: 'bg-gray-400', label: 'N/A' };
    }
  };
  
  const config = getConfig();
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-white text-xs ${
      isConnected ? config.bg : 'bg-gray-400'
    } ${className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// ============================================
// OFFLINE MODE BANNER
// ============================================

export interface OfflineModeBannerProps {
  pendingSync?: number;
  onEnterOnline?: () => void;
  className?: string;
}

export const OfflineModeBanner: React.FC<OfflineModeBannerProps> = ({
  pendingSync = 0,
  onEnterOnline,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className={`bg-amber-500 text-amber-950 ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <CloudOff className="w-5 h-5" />
          <div>
            <span className="font-medium">오프라인 모드</span>
            {pendingSync > 0 && (
              <span className="ml-2 text-sm opacity-80">
                {pendingSync}개 데이터가 동기화 대기 중입니다
              </span>
            )}
          </div>
        </div>
        
        {onEnterOnline && (
          <button
            onClick={onEnterOnline}
            className="px-3 py-1 text-sm bg-amber-600 rounded hover:bg-amber-700"
          >
            온라인 전환
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ConnectivityStatus;


