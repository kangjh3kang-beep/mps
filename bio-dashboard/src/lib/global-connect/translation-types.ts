/**
 * ============================================================
 * MANPASIK GLOBAL CONNECT - TYPE DEFINITIONS
 * Real-Time Translation & Communication Types
 * ============================================================
 */

// Supported Languages
export type SupportedLanguage = 
  | 'ko-KR' // Korean
  | 'en-US' // English (US)
  | 'en-GB' // English (UK)
  | 'ja-JP' // Japanese
  | 'zh-CN' // Chinese (Simplified)
  | 'zh-TW' // Chinese (Traditional)
  | 'es-ES' // Spanish
  | 'fr-FR' // French
  | 'de-DE' // German
  | 'pt-BR' // Portuguese (Brazil)
  | 'vi-VN' // Vietnamese
  | 'th-TH' // Thai
  | 'id-ID' // Indonesian
  | 'ar-SA' // Arabic
  | 'hi-IN' // Hindi
  | 'ru-RU'; // Russian

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

// Translation Modes
export type TranslationMode = 'subtitles' | 'dubbing' | 'off';

// Session Metadata
export interface TranslationSession {
  sessionId: string;
  userLanguage: SupportedLanguage;
  remoteLanguage: SupportedLanguage;
  mode: TranslationMode;
  originalAudioVolume: number; // 0.0 - 1.0
  showOriginalText: boolean;
  createdAt: Date;
}

// Message Types
export interface TranslatedMessage {
  id: string;
  senderId: string;
  senderName: string;
  originalText: string;
  originalLanguage: SupportedLanguage;
  translatedText: string;
  targetLanguage: SupportedLanguage;
  timestamp: Date;
  isVerified: boolean; // Medical term verification
  medicalNotes?: string[];
}

// Audio Chunk for streaming
export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  sampleRate: number;
  channels: number;
}

// Translation Pipeline Status
export interface PipelineStatus {
  stt: 'idle' | 'processing' | 'error';
  mt: 'idle' | 'processing' | 'error';
  tts: 'idle' | 'processing' | 'error';
  latencyMs: number;
}

// Expert/Coach Profile
export interface GlobalExpert {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  nativeLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  hasAITranslation: boolean;
  rating: number;
  reviewCount: number;
  avatarUrl: string;
  isOnline: boolean;
  timezone: string;
  hourlyRate: number;
  currency: string;
}

// WebSocket Message Types
export type WSMessageType = 
  | 'audio_chunk'
  | 'transcription'
  | 'translation'
  | 'tts_audio'
  | 'status'
  | 'error'
  | 'session_start'
  | 'session_end';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: number;
  sessionId: string;
}






