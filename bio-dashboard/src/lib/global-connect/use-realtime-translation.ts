"use client";

/**
 * ============================================================
 * MANPASIK GLOBAL CONNECT - REAL-TIME TRANSLATION HOOK
 * WebRTC Audio Stream Management & Translation API Integration
 * ============================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  SupportedLanguage,
  TranslationMode,
  TranslationSession,
  PipelineStatus,
  AudioChunk,
} from './translation-types';

interface TranslationConfig {
  userLanguage: SupportedLanguage;
  remoteLanguage: SupportedLanguage;
  mode: TranslationMode;
  originalAudioVolume?: number;
  wsEndpoint?: string;
}

interface TranslationState {
  isConnected: boolean;
  isTranslating: boolean;
  session: TranslationSession | null;
  pipelineStatus: PipelineStatus;
  currentTranscript: string;
  currentTranslation: string;
  error: string | null;
}

interface UseRealTimeTranslationReturn extends TranslationState {
  // Controls
  startTranslation: (remoteStream: MediaStream) => Promise<void>;
  stopTranslation: () => void;
  setMode: (mode: TranslationMode) => void;
  setOriginalVolume: (volume: number) => void;
  setLanguages: (user: SupportedLanguage, remote: SupportedLanguage) => void;
  
  // Audio outputs
  translatedAudioRef: React.RefObject<HTMLAudioElement>;
  originalAudioRef: React.RefObject<HTMLAudioElement>;
}

const DEFAULT_WS_ENDPOINT = process.env.NEXT_PUBLIC_TRANSLATION_WS_URL || 'wss://api.manpasik.com/translate-stream';

export function useRealTimeTranslation(config: TranslationConfig): UseRealTimeTranslationReturn {
  const [state, setState] = useState<TranslationState>({
    isConnected: false,
    isTranslating: false,
    session: null,
    pipelineStatus: {
      stt: 'idle',
      mt: 'idle',
      tts: 'idle',
      latencyMs: 0,
    },
    currentTranscript: '',
    currentTranslation: '',
    error: null,
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const translatedAudioRef = useRef<HTMLAudioElement>(null);
  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const configRef = useRef(config);

  // Update config ref
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  /**
   * Connect to WebSocket translation server
   */
  const connectWebSocket = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const wsEndpoint = configRef.current.wsEndpoint || DEFAULT_WS_ENDPOINT;
      
      try {
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[Translation] WebSocket connected');
          
          // Send session initialization
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          ws.send(JSON.stringify({
            type: 'session_start',
            payload: {
              sessionId,
              userLanguage: configRef.current.userLanguage,
              remoteLanguage: configRef.current.remoteLanguage,
              mode: configRef.current.mode,
            },
            timestamp: Date.now(),
            sessionId,
          }));

          setState(prev => ({
            ...prev,
            isConnected: true,
            session: {
              sessionId,
              userLanguage: configRef.current.userLanguage,
              remoteLanguage: configRef.current.remoteLanguage,
              mode: configRef.current.mode,
              originalAudioVolume: configRef.current.originalAudioVolume ?? 0.1,
              showOriginalText: true,
              createdAt: new Date(),
            },
            error: null,
          }));

          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleWSMessage(message);
          } catch (e) {
            console.error('[Translation] Failed to parse message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('[Translation] WebSocket error:', error);
          setState(prev => ({ ...prev, error: 'WebSocket connection error' }));
          reject(error);
        };

        ws.onclose = () => {
          console.log('[Translation] WebSocket disconnected');
          setState(prev => ({ ...prev, isConnected: false, isTranslating: false }));
        };

      } catch (error) {
        reject(error);
      }
    });
  }, []);

  /**
   * Handle incoming WebSocket messages
   */
  const handleWSMessage = useCallback((message: { type: string; payload: unknown }) => {
    switch (message.type) {
      case 'transcription':
        // STT result from remote speech
        setState(prev => ({
          ...prev,
          currentTranscript: message.payload as string,
          pipelineStatus: { ...prev.pipelineStatus, stt: 'idle', mt: 'processing' },
        }));
        break;

      case 'translation':
        // Machine translation result
        setState(prev => ({
          ...prev,
          currentTranslation: message.payload as string,
          pipelineStatus: { ...prev.pipelineStatus, mt: 'idle', tts: 'processing' },
        }));
        break;

      case 'tts_audio':
        // Synthesized audio in user's language
        playTranslatedAudio(message.payload as string); // Base64 audio
        setState(prev => ({
          ...prev,
          pipelineStatus: { ...prev.pipelineStatus, tts: 'idle' },
        }));
        break;

      case 'status':
        const status = message.payload as { latencyMs: number };
        setState(prev => ({
          ...prev,
          pipelineStatus: { ...prev.pipelineStatus, latencyMs: status.latencyMs },
        }));
        break;

      case 'error':
        setState(prev => ({ ...prev, error: message.payload as string }));
        break;
    }
  }, []);

  /**
   * Play translated TTS audio
   */
  const playTranslatedAudio = useCallback((base64Audio: string) => {
    if (translatedAudioRef.current && configRef.current.mode === 'dubbing') {
      const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      translatedAudioRef.current.src = audioUrl;
      translatedAudioRef.current.play().catch(console.error);
    }
  }, []);

  /**
   * Start translation with remote media stream
   */
  const startTranslation = useCallback(async (remoteStream: MediaStream) => {
    try {
      // Connect WebSocket if not connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        await connectWebSocket();
      }

      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create source from remote stream
      sourceRef.current = audioContextRef.current.createMediaStreamSource(remoteStream);

      // Create processor for audio chunks
      // Note: ScriptProcessorNode is deprecated but widely supported
      // In production, use AudioWorklet for better performance
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const audioChunk: AudioChunk = {
          data: float32ToInt16(inputData).buffer,
          timestamp: Date.now(),
          sampleRate: audioContextRef.current?.sampleRate || 44100,
          channels: 1,
        };

        // Send audio chunk to translation server
        wsRef.current.send(JSON.stringify({
          type: 'audio_chunk',
          payload: arrayBufferToBase64(audioChunk.data),
          timestamp: audioChunk.timestamp,
          sessionId: state.session?.sessionId,
        }));

        setState(prev => ({
          ...prev,
          pipelineStatus: { ...prev.pipelineStatus, stt: 'processing' },
        }));
      };

      // Connect nodes
      sourceRef.current.connect(processorRef.current);
      
      // Connect to original audio output (with volume control)
      if (originalAudioRef.current) {
        const originalGain = audioContextRef.current.createGain();
        originalGain.gain.value = configRef.current.mode === 'dubbing' 
          ? (configRef.current.originalAudioVolume ?? 0.1)
          : 1.0;
        processorRef.current.connect(originalGain);
        originalGain.connect(audioContextRef.current.destination);
      }

      setState(prev => ({ ...prev, isTranslating: true }));
      console.log('[Translation] Started real-time translation');

    } catch (error) {
      console.error('[Translation] Failed to start:', error);
      setState(prev => ({ ...prev, error: 'Failed to start translation' }));
    }
  }, [connectWebSocket, state.session?.sessionId]);

  /**
   * Stop translation
   */
  const stopTranslation = useCallback(() => {
    // Disconnect audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Send session end
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'session_end',
        payload: {},
        timestamp: Date.now(),
        sessionId: state.session?.sessionId,
      }));
      wsRef.current.close();
    }

    setState(prev => ({
      ...prev,
      isTranslating: false,
      currentTranscript: '',
      currentTranslation: '',
    }));

    console.log('[Translation] Stopped');
  }, [state.session?.sessionId]);

  /**
   * Set translation mode
   */
  const setMode = useCallback((mode: TranslationMode) => {
    setState(prev => {
      if (!prev.session) return prev;
      return {
        ...prev,
        session: { ...prev.session, mode },
      };
    });

    // Notify server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'status',
        payload: { mode },
        timestamp: Date.now(),
        sessionId: state.session?.sessionId,
      }));
    }
  }, [state.session?.sessionId]);

  /**
   * Set original audio volume (for dubbing mode)
   */
  const setOriginalVolume = useCallback((volume: number) => {
    setState(prev => {
      if (!prev.session) return prev;
      return {
        ...prev,
        session: { ...prev.session, originalAudioVolume: volume },
      };
    });
  }, []);

  /**
   * Set languages
   */
  const setLanguages = useCallback((user: SupportedLanguage, remote: SupportedLanguage) => {
    setState(prev => {
      if (!prev.session) return prev;
      return {
        ...prev,
        session: { 
          ...prev.session, 
          userLanguage: user,
          remoteLanguage: remote,
        },
      };
    });

    // Notify server of language change
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'status',
        payload: { userLanguage: user, remoteLanguage: remote },
        timestamp: Date.now(),
        sessionId: state.session?.sessionId,
      }));
    }
  }, [state.session?.sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTranslation();
    };
  }, [stopTranslation]);

  return {
    ...state,
    startTranslation,
    stopTranslation,
    setMode,
    setOriginalVolume,
    setLanguages,
    translatedAudioRef,
    originalAudioRef,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}






