/**
 * ============================================================
 * MANPASIK SYSTEM OPTIMIZATION - PERFORMANCE CONFIG
 * Lightweight & High-Performance Configuration
 * ============================================================
 */

// ============================================
// BUNDLE OPTIMIZATION CONFIG
// ============================================

export const BUNDLE_CONFIG = {
  // Dynamic Import Thresholds
  LAZY_LOAD_THRESHOLD: 50, // Components with >50 lines should be lazy loaded
  
  // Code Splitting Chunks
  CHUNKS: {
    vendor: ['react', 'react-dom', 'framer-motion'],
    charts: ['recharts'],
    ui: ['@radix-ui'],
    ai: ['openai'],
    translation: ['livekit', 'agora'],
  },
  
  // Tree Shaking
  SIDE_EFFECTS_FREE: [
    '@/components/ui/*',
    '@/lib/utils',
  ],
};

// ============================================
// CACHING STRATEGY
// ============================================

export const CACHE_CONFIG = {
  // API Response Cache TTL (seconds)
  API_CACHE_TTL: {
    healthScore: 60,           // 1 minute
    measurements: 300,         // 5 minutes
    expertList: 600,           // 10 minutes
    staticContent: 3600,       // 1 hour
    userPreferences: 86400,    // 24 hours
  },
  
  // Local Storage Keys
  STORAGE_KEYS: {
    userSettings: 'mps_settings_v2',
    cachedHealthData: 'mps_health_cache',
    offlineQueue: 'mps_offline_queue',
    translationCache: 'mps_translation_cache',
  },
  
  // Memory Cache Limits
  MEMORY_LIMITS: {
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    maxItems: 1000,
    evictionPolicy: 'lru' as const, // Least Recently Used
  },
};

// ============================================
// NETWORK OPTIMIZATION
// ============================================

export const NETWORK_CONFIG = {
  // Request Batching
  BATCH_WINDOW_MS: 50, // Batch requests within 50ms
  MAX_BATCH_SIZE: 10,
  
  // Retry Strategy
  RETRY: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  },
  
  // Request Prioritization
  PRIORITY: {
    critical: 0,    // Health alerts, emergency
    high: 1,        // Measurements, real-time data
    normal: 2,      // UI updates, preferences
    low: 3,         // Analytics, background sync
  },
  
  // Compression
  COMPRESSION: {
    enabled: true,
    minSize: 1024, // Only compress >1KB
    algorithm: 'gzip' as const,
  },
};

// ============================================
// RENDERING OPTIMIZATION
// ============================================

export const RENDER_CONFIG = {
  // Virtual Scrolling
  VIRTUALIZATION: {
    itemHeight: 80,
    overscanCount: 5,
    threshold: 50, // Enable virtualization for >50 items
  },
  
  // Debounce/Throttle Delays
  DEBOUNCE: {
    search: 300,
    resize: 100,
    scroll: 16,  // ~60fps
    input: 150,
  },
  
  // Animation
  ANIMATION: {
    reduceMotion: false, // Respect user preference
    defaultDuration: 200,
    pageTransition: 300,
  },
  
  // Intersection Observer
  INTERSECTION: {
    rootMargin: '100px',
    threshold: 0.1,
  },
};

// ============================================
// PERSONA-SPECIFIC OPTIMIZATIONS
// ============================================

export const PERSONA_OPTIMIZATIONS = {
  // Senior Mode (User 35, 36)
  senior: {
    fontScale: 1.4,
    buttonSize: 'lg',
    animationDuration: 400,
    voiceEnabled: true,
    contrastMode: 'high',
  },
  
  // Kids Mode (User 27)
  kids: {
    gamificationEnabled: true,
    simplifiedUI: true,
    parentalControls: true,
  },
  
  // Athlete Mode (User 21, 22, 23, 24)
  athlete: {
    realTimeUpdates: true,
    motionArtifactFilter: true,
    quickMeasure: true,
  },
  
  // Chronic Patient Mode (User 31-34)
  chronic: {
    alertThresholds: 'strict',
    medicationReminders: true,
    trendAnalysis: 'enhanced',
  },
  
  // Developer Mode (User 38, 39)
  developer: {
    apiAccess: true,
    rawDataExport: true,
    debugPanel: true,
  },
};

// ============================================
// MEMORY MANAGEMENT
// ============================================

export const MEMORY_CONFIG = {
  // Garbage Collection Hints
  GC_INTERVAL_MS: 60000, // Suggest GC every minute
  
  // Image Optimization
  IMAGE: {
    maxWidth: 1920,
    quality: 80,
    format: 'webp' as const,
    lazyLoad: true,
  },
  
  // Chart Data Limits
  CHART: {
    maxDataPoints: 100,
    aggregationThreshold: 1000,
    downsampleFactor: 10,
  },
  
  // History Limits
  HISTORY: {
    maxMeasurements: 365, // 1 year
    maxMessages: 100,
    maxNotifications: 50,
  },
};

// ============================================
// OFFLINE SUPPORT
// ============================================

export const OFFLINE_CONFIG = {
  // Service Worker
  SW_CACHE_VERSION: 'v2',
  
  // Offline Queue
  QUEUE: {
    maxSize: 100,
    maxAge: 86400000, // 24 hours
    retryInterval: 30000, // 30 seconds
  },
  
  // Critical Assets for Offline
  CRITICAL_ASSETS: [
    '/',
    '/measure',
    '/result',
    '/emergency',
  ],
};




