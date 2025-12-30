/**
 * ============================================================
 * MANPASIK MATE - COMPONENT EXPORTS
 * Voice-Enabled AI Companion System
 * ============================================================
 */

// Core Components
export { ManpasikAvatar } from './ManpasikAvatar';
export type { AvatarExpression } from './ManpasikAvatar';

export { FloatingMateButton } from './FloatingMateButton';
export { MateProvider, useMate } from './MateProvider';
export { PersonalitySetup } from './PersonalitySetup';

// Proactive Nudge System
export { 
  LunchtimeInterceptor, 
  CartridgeManager,
  useProactiveNudge 
} from './ProactiveNudge';

// Re-export lib modules
export { VoiceManager, useVoiceManager } from '@/lib/mate/voice-manager';
export type { EmotionalTone, VoiceConfig } from '@/lib/mate/voice-manager';

export { ScreenInterpreter } from '@/lib/mate/screen-interpreter';
export type { 
  ScreenType, 
  ScreenContext, 
  HealthMetrics, 
  VoiceScript,
  PersonalityType 
} from '@/lib/mate/screen-interpreter';

export { MemoryVectorDB } from '@/lib/mate/memory-vector-db';
export type { 
  UserMemory, 
  MemoryType, 
  MemorySearchResult 
} from '@/lib/mate/memory-vector-db';






