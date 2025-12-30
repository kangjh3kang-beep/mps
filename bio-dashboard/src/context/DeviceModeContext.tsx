"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  DeviceMode,
  DEVICE_MODES,
  DeviceModeConfig,
  detectDeviceMode,
  getModeFromPath,
  saveDeviceModePreference,
  loadDeviceModePreference,
  isFeatureAvailable
} from "@/lib/device-mode";

/* ============================================
 * Types
 * ============================================ */

interface DeviceModeContextType {
  // Current mode
  mode: DeviceMode;
  config: DeviceModeConfig;
  
  // Mode detection
  detectedMode: DeviceMode;
  isOverridden: boolean;
  
  // Actions
  setMode: (mode: DeviceMode) => void;
  resetToDetected: () => void;
  
  // Feature checks
  hasFeature: (feature: string) => boolean;
  
  // Viewport info
  viewportWidth: number;
  viewportHeight: number;
  
  // Convenience flags
  isReader: boolean;
  isMobile: boolean;
  isDesktop: boolean;
}

/* ============================================
 * Context
 * ============================================ */

const DeviceModeContext = createContext<DeviceModeContextType | null>(null);

/* ============================================
 * Provider
 * ============================================ */

export function DeviceModeProvider({ 
  children,
  forcedMode
}: { 
  children: React.ReactNode;
  forcedMode?: DeviceMode;
}) {
  // Viewport state
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 768
  );
  
  // Mode state
  const [userOverrideMode, setUserOverrideMode] = useState<DeviceMode | null>(null);
  
  // Detected mode based on viewport
  const detectedMode = useMemo(() => detectDeviceMode(viewportWidth), [viewportWidth]);
  
  // Effective mode (forced > user override > detected)
  const mode = useMemo(() => {
    if (forcedMode) return forcedMode;
    if (userOverrideMode) return userOverrideMode;
    return detectedMode;
  }, [forcedMode, userOverrideMode, detectedMode]);
  
  // Mode configuration
  const config = useMemo(() => DEVICE_MODES[mode], [mode]);
  
  // Is mode overridden by user?
  const isOverridden = useMemo(() => 
    !!userOverrideMode && userOverrideMode !== detectedMode,
    [userOverrideMode, detectedMode]
  );
  
  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Load saved preference on mount
  useEffect(() => {
    const savedMode = loadDeviceModePreference();
    if (savedMode) {
      setUserOverrideMode(savedMode);
    }
  }, []);
  
  // Check URL for mode override
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlMode = getModeFromPath(
        window.location.pathname,
        new URLSearchParams(window.location.search)
      );
      if (urlMode) {
        setUserOverrideMode(urlMode);
      }
    }
  }, []);
  
  // Set mode action
  const setMode = useCallback((newMode: DeviceMode) => {
    setUserOverrideMode(newMode);
    saveDeviceModePreference(newMode);
  }, []);
  
  // Reset to detected mode
  const resetToDetected = useCallback(() => {
    setUserOverrideMode(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("manpasik-device-mode");
    }
  }, []);
  
  // Feature check helper
  const hasFeature = useCallback((feature: string) => {
    return isFeatureAvailable(mode, feature);
  }, [mode]);
  
  // Context value
  const value = useMemo<DeviceModeContextType>(() => ({
    mode,
    config,
    detectedMode,
    isOverridden,
    setMode,
    resetToDetected,
    hasFeature,
    viewportWidth,
    viewportHeight,
    isReader: mode === "reader",
    isMobile: mode === "mobile",
    isDesktop: mode === "desktop"
  }), [
    mode,
    config,
    detectedMode,
    isOverridden,
    setMode,
    resetToDetected,
    hasFeature,
    viewportWidth,
    viewportHeight
  ]);
  
  return (
    <DeviceModeContext.Provider value={value}>
      {children}
    </DeviceModeContext.Provider>
  );
}

/* ============================================
 * Hook
 * ============================================ */

export function useDeviceMode() {
  const context = useContext(DeviceModeContext);
  if (!context) {
    throw new Error("useDeviceMode must be used within a DeviceModeProvider");
  }
  return context;
}

/* ============================================
 * Mode Switcher Component
 * ============================================ */

export function ModeSwitcher({ className }: { className?: string }) {
  const { mode, setMode, detectedMode, isOverridden, resetToDetected } = useDeviceMode();
  
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as DeviceMode)}
        className="text-xs bg-white border rounded px-2 py-1"
      >
        <option value="reader">📟 Reader</option>
        <option value="mobile">📱 Mobile</option>
        <option value="desktop">🖥️ Desktop</option>
      </select>
      {isOverridden && (
        <button
          onClick={resetToDetected}
          className="text-xs text-blue-600 hover:underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}

export default DeviceModeContext;






