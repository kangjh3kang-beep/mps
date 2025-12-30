/**
 * ============================================================
 * MANPASIK GLOBAL CONNECT - COMPONENT EXPORTS
 * Real-Time Translation & Global Communication System
 * ============================================================
 */

// UI Components
export { TranslatedChat } from './TranslatedChat';
export { LiveTranslationSettings } from './LiveTranslationSettings';
export { VideoCallOverlay } from './VideoCallOverlay';
export { GlobalExpertCard } from './GlobalExpertCard';

// Hooks & Utils
export { useRealTimeTranslation } from '@/lib/global-connect/use-realtime-translation';

// Types
export type {
  SupportedLanguage,
  LanguageInfo,
  TranslationMode,
  TranslationSession,
  TranslatedMessage,
  AudioChunk,
  PipelineStatus,
  GlobalExpert,
  WSMessageType,
  WSMessage,
} from '@/lib/global-connect/translation-types';

export { SUPPORTED_LANGUAGES } from '@/lib/global-connect/translation-types';






