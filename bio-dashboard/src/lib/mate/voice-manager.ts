"use client";

/**
 * ============================================================
 * MANPASIK MATE - VOICE MANAGER
 * Text-to-Speech & Speech-to-Text with Emotional Modulation
 * ============================================================
 */

export type EmotionalTone = 'neutral' | 'happy' | 'concerned' | 'stern' | 'excited' | 'calm';

export interface VoiceConfig {
  rate: number;      // 0.1 to 10
  pitch: number;     // 0 to 2
  volume: number;    // 0 to 1
  voice?: SpeechSynthesisVoice;
}

// Emotional presets for TTS modulation
const EMOTIONAL_PRESETS: Record<EmotionalTone, Partial<VoiceConfig>> = {
  neutral: { rate: 1.0, pitch: 1.0 },
  happy: { rate: 1.1, pitch: 1.2 },
  concerned: { rate: 0.9, pitch: 0.9 },
  stern: { rate: 0.85, pitch: 0.8 },
  excited: { rate: 1.2, pitch: 1.3 },
  calm: { rate: 0.8, pitch: 0.95 },
};

class VoiceManagerClass {
  private synthesis: SpeechSynthesis | null = null;
  private recognition: SpeechRecognition | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;
  private isSpeaking = false;
  private speechQueue: { text: string; emotion: EmotionalTone }[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Initialize Speech Synthesis
    this.synthesis = window.speechSynthesis;
    
    // Load voices
    const loadVoices = () => {
      this.voices = this.synthesis?.getVoices() || [];
      // Prefer Korean voice, fallback to English
      this.preferredVoice = 
        this.voices.find(v => v.lang.startsWith('ko')) ||
        this.voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
        this.voices[0] || null;
      this.isInitialized = true;
    };

    if (this.synthesis) {
      loadVoices();
      this.synthesis.onvoiceschanged = loadVoices;
    }

    // Initialize Speech Recognition
    const SpeechRecognitionAPI = 
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition || 
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ko-KR';
    }
  }

  /**
   * Speak text with emotional modulation
   */
  speak(text: string, emotion: EmotionalTone = 'neutral'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const preset = EMOTIONAL_PRESETS[emotion];

      utterance.rate = preset.rate || 1.0;
      utterance.pitch = preset.pitch || 1.0;
      utterance.volume = 1.0;
      
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.processQueue();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        reject(event.error);
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Queue speech for sequential playback
   */
  queueSpeak(text: string, emotion: EmotionalTone = 'neutral') {
    this.speechQueue.push({ text, emotion });
    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.speechQueue.length === 0) return;
    
    const next = this.speechQueue.shift();
    if (next) {
      await this.speak(next.text, next.emotion);
    }
  }

  /**
   * Stop all speech
   */
  stop() {
    this.synthesis?.cancel();
    this.speechQueue = [];
    this.isSpeaking = false;
  }

  /**
   * Start listening for voice commands
   */
  startListening(onResult: (transcript: string, isFinal: boolean) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      this.recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        onResult(transcript, lastResult.isFinal);
      };

      this.recognition.onerror = (event) => {
        reject(event.error);
      };

      this.recognition.onend = () => {
        resolve();
      };

      this.recognition.start();
    });
  }

  /**
   * Stop listening
   */
  stopListening() {
    this.recognition?.stop();
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking() {
    return this.isSpeaking;
  }

  /**
   * Get available voices
   */
  getVoices() {
    return this.voices;
  }

  /**
   * Set preferred voice by name
   */
  setVoice(voiceName: string) {
    this.preferredVoice = this.voices.find(v => v.name === voiceName) || this.preferredVoice;
  }
}

// Singleton instance
export const VoiceManager = typeof window !== 'undefined' ? new VoiceManagerClass() : null;

// React Hook for Voice Manager
import { useState, useEffect, useCallback } from 'react';

export function useVoiceManager() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (VoiceManager) {
      setVoices(VoiceManager.getVoices());
    }
  }, []);

  const speak = useCallback(async (text: string, emotion: EmotionalTone = 'neutral') => {
    if (!VoiceManager) return;
    
    setIsSpeaking(true);
    try {
      await VoiceManager.speak(text, emotion);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const queueSpeak = useCallback((text: string, emotion: EmotionalTone = 'neutral') => {
    VoiceManager?.queueSpeak(text, emotion);
  }, []);

  const stopSpeaking = useCallback(() => {
    VoiceManager?.stop();
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(async () => {
    if (!VoiceManager) return;
    
    setIsListening(true);
    setTranscript('');
    
    try {
      await VoiceManager.startListening((text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          setIsListening(false);
        }
      });
    } catch (error) {
      console.error('Voice recognition error:', error);
    } finally {
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    VoiceManager?.stopListening();
    setIsListening(false);
  }, []);

  return {
    speak,
    queueSpeak,
    stopSpeaking,
    startListening,
    stopListening,
    isSpeaking,
    isListening,
    transcript,
    voices,
  };
}






