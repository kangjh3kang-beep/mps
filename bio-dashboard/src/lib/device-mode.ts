/**
 * Omni-Channel Device Mode Detection & Management
 * 
 * Supports three modes:
 * - Reader: Embedded device (480x320)
 * - Mobile: Smartphone consumer app
 * - Desktop: PC/Pro expert dashboard
 */

export type DeviceMode = "reader" | "mobile" | "desktop";

export interface DeviceModeConfig {
  mode: DeviceMode;
  name: string;
  nameKo: string;
  description: string;
  maxWidth: number;
  minWidth: number;
  features: string[];
}

export const DEVICE_MODES: Record<DeviceMode, DeviceModeConfig> = {
  reader: {
    mode: "reader",
    name: "Reader Mode",
    nameKo: "리더 모드",
    description: "Embedded device UI (480x320)",
    maxWidth: 480,
    minWidth: 0,
    features: ["measure", "result", "emergency"]
  },
  mobile: {
    mode: "mobile",
    name: "Smartphone Mode",
    nameKo: "스마트폰 모드",
    description: "Full consumer app experience",
    maxWidth: 1024,
    minWidth: 481,
    features: ["feed", "chat", "store", "booking", "analysis", "prescriptions"]
  },
  desktop: {
    mode: "desktop",
    name: "Pro Mode",
    nameKo: "프로 모드",
    description: "Expert dashboard for doctors & researchers",
    maxWidth: Infinity,
    minWidth: 1025,
    features: ["realtime-signals", "long-term-trends", "hospital-records", "export", "multi-patient"]
  }
};

/**
 * Detect device mode based on viewport width
 */
export function detectDeviceMode(width: number): DeviceMode {
  if (width <= DEVICE_MODES.reader.maxWidth) {
    return "reader";
  } else if (width <= DEVICE_MODES.mobile.maxWidth) {
    return "mobile";
  } else {
    return "desktop";
  }
}

/**
 * Get mode from URL path or query parameter
 */
export function getModeFromPath(pathname: string, searchParams?: URLSearchParams): DeviceMode | null {
  // Check URL path
  if (pathname.startsWith("/mode/reader")) return "reader";
  if (pathname.startsWith("/mode/mobile")) return "mobile";
  if (pathname.startsWith("/mode/desktop") || pathname.startsWith("/mode/pro")) return "desktop";
  
  // Check query parameter
  const modeParam = searchParams?.get("mode");
  if (modeParam && (modeParam === "reader" || modeParam === "mobile" || modeParam === "desktop")) {
    return modeParam;
  }
  
  return null;
}

/**
 * Get mode-specific route prefix
 */
export function getModeRoutePath(mode: DeviceMode): string {
  switch (mode) {
    case "reader":
      return "/mode/reader";
    case "desktop":
      return "/mode/desktop";
    default:
      return ""; // Mobile is the default, no prefix
  }
}

/**
 * Local storage key for user preference
 */
const MODE_STORAGE_KEY = "manpasik-device-mode";

/**
 * Save user's mode preference
 */
export function saveDeviceModePreference(mode: DeviceMode): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }
}

/**
 * Load user's mode preference
 */
export function loadDeviceModePreference(): DeviceMode | null {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === "reader" || saved === "mobile" || saved === "desktop") {
      return saved;
    }
  }
  return null;
}

/**
 * Check if a feature is available in the current mode
 */
export function isFeatureAvailable(mode: DeviceMode, feature: string): boolean {
  return DEVICE_MODES[mode].features.includes(feature);
}






