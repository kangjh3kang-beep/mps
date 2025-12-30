/**
 * ============================================================
 * MANPASIK SYSTEM OPTIMIZATION - EXPORTS
 * Centralized Export for All Optimization Utilities
 * ============================================================
 */

// Configuration
export {
  BUNDLE_CONFIG,
  CACHE_CONFIG,
  NETWORK_CONFIG,
  RENDER_CONFIG,
  PERSONA_OPTIMIZATIONS,
  MEMORY_CONFIG,
  OFFLINE_CONFIG,
} from './performance-config';

// React Hooks
export {
  useDebouncedState,
  useThrottledCallback,
  useIntersectionObserver,
  useCachedFetch,
  useVirtualList,
  useDownsampledData,
  useNonBlockingState,
  useWindowSize,
  usePrevious,
  useStableCallback,
} from './use-optimized';

// API Optimization
export {
  apiOptimizer,
  optimizedFetch,
} from './api-optimizer';

// Render Components
export {
  LazyRender,
  VirtualList,
  Memoized,
  Skeleton,
  ProgressiveImage,
  DownsampledChart,
  Deferred,
} from './render-optimizer';

// Lazy Components
export {
  LazyTrendChart,
  LazyBioRhythmChart,
  LazyAICoachChat,
  LazyTranslatedChat,
  LazyVideoCallOverlay,
  LazyManpasikAvatar,
  LazyFloatingMateButton,
  LazySeniorModeProvider,
  LazyKidsModeProvider,
  preloadComponent,
} from './lazy-components';

// 41-Persona Patches
export {
  CRITICAL_ISSUES,
  INNOVATIVE_FEATURES,
  PATCH_STATUS,
  PERFORMANCE_METRICS,
} from './persona-patches';

// Manpasik 2.0 Vision
export {
  MANPASIK_2_0_VISION,
  generateEvolutionReport,
} from './manpasik-2.0-evolution';




