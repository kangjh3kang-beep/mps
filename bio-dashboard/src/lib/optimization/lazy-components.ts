/**
 * ============================================================
 * MANPASIK SYSTEM OPTIMIZATION - LAZY COMPONENTS
 * Dynamic Imports for Code Splitting
 * ============================================================
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading Placeholder
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Error Fallback
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="p-4 text-center text-red-500">
    <p>컴포넌트 로딩 실패</p>
    <p className="text-xs">{error.message}</p>
  </div>
);

// ============================================
// HEAVY CHART COMPONENTS (Lazy Load)
// ============================================

export const LazyTrendChart = dynamic(
  () => import('@/components/dashboard/TrendChart').then(mod => ({ default: mod.TrendChart })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
);

export const LazyBioRhythmChart = dynamic(
  () => import('@/components/dashboard/bio-rhythm-chart').then(mod => ({ default: mod.BioRhythmChart })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
);

// ============================================
// AI & TRANSLATION COMPONENTS (Lazy Load)
// ============================================

export const LazyAICoachChat = dynamic(
  () => import('@/components/dashboard/AICoachChat'),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
);

export const LazyTranslatedChat = dynamic(
  () => import('@/components/global-connect/TranslatedChat').then(mod => ({ default: mod.TranslatedChat })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
);

export const LazyVideoCallOverlay = dynamic(
  () => import('@/components/global-connect/VideoCallOverlay').then(mod => ({ default: mod.VideoCallOverlay })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
);

// ============================================
// MATE COMPONENTS (Lazy Load)
// ============================================

export const LazyManpasikAvatar = dynamic(
  () => import('@/components/mate/ManpasikAvatar').then(mod => ({ default: mod.ManpasikAvatar })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
);

export const LazyFloatingMateButton = dynamic(
  () => import('@/components/mate/FloatingMateButton').then(mod => ({ default: mod.FloatingMateButton })),
  { 
    loading: () => null, // No loading for floating button
    ssr: false 
  }
);

// ============================================
// SCHOOL COMPONENTS (Lazy Load)
// ============================================

export const LazyVisionPage = dynamic(
  () => import('@/app/school/vision/page'),
  { 
    loading: LoadingSpinner,
  }
);

export const LazyAgoraPage = dynamic(
  () => import('@/app/school/agora/page'),
  { 
    loading: LoadingSpinner,
  }
);

// ============================================
// ACCESSIBILITY COMPONENTS (Lazy Load)
// ============================================

export const LazySeniorModeProvider = dynamic(
  () => import('@/components/accessibility/SeniorModeProvider').then(mod => ({ default: mod.SeniorModeProvider })),
  { 
    loading: () => null,
    ssr: false 
  }
);

export const LazyKidsModeProvider = dynamic(
  () => import('@/components/accessibility/KidsModeProvider').then(mod => ({ default: mod.KidsModeProvider })),
  { 
    loading: () => null,
    ssr: false 
  }
);

// ============================================
// UTILITY: Preload Components
// ============================================

export function preloadComponent(componentLoader: () => Promise<unknown>) {
  // Start loading in the background
  componentLoader().catch(() => {
    // Silently fail - will retry on actual render
  });
}

// Preload critical components after initial load
if (typeof window !== 'undefined') {
  // After 3 seconds, start preloading heavy components
  setTimeout(() => {
    preloadComponent(() => import('@/components/dashboard/TrendChart'));
    preloadComponent(() => import('@/components/dashboard/AICoachChat'));
  }, 3000);
}




