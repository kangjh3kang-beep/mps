/**
 * ============================================================
 * MANPASIK GLOBAL CONNECT - TRANSLATION STREAM API
 * REST endpoint for translation (WebSocket alternative)
 * Note: For true real-time, use a dedicated WebSocket server
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';

// Translation Pipeline Configuration
interface TranslationRequest {
  sessionId: string;
  audioBase64?: string;
  text?: string;
  sourceLanguage: string;
  targetLanguage: string;
  mode: 'stt' | 'mt' | 'tts' | 'full';
}

interface TranslationResponse {
  sessionId: string;
  transcript?: string;
  translation?: string;
  audioBase64?: string;
  latencyMs: number;
  error?: string;
}

// Language code mappings for different APIs
const LANGUAGE_MAP: Record<string, { whisper: string; gpt: string; tts: string }> = {
  'ko-KR': { whisper: 'korean', gpt: 'Korean', tts: 'ko-KR' },
  'en-US': { whisper: 'english', gpt: 'English', tts: 'en-US' },
  'en-GB': { whisper: 'english', gpt: 'British English', tts: 'en-GB' },
  'ja-JP': { whisper: 'japanese', gpt: 'Japanese', tts: 'ja-JP' },
  'zh-CN': { whisper: 'chinese', gpt: 'Simplified Chinese', tts: 'zh-CN' },
  'es-ES': { whisper: 'spanish', gpt: 'Spanish', tts: 'es-ES' },
  'fr-FR': { whisper: 'french', gpt: 'French', tts: 'fr-FR' },
  'de-DE': { whisper: 'german', gpt: 'German', tts: 'de-DE' },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body = await request.json() as TranslationRequest;
    const { sessionId, audioBase64, text, sourceLanguage, targetLanguage, mode } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const response: TranslationResponse = {
      sessionId,
      latencyMs: 0,
    };

    // Step 1: Speech-to-Text (if audio provided)
    if ((mode === 'stt' || mode === 'full') && audioBase64) {
      const transcript = await speechToText(audioBase64, sourceLanguage);
      response.transcript = transcript;
    }

    // Step 2: Machine Translation (if text or transcript available)
    const textToTranslate = text || response.transcript;
    if ((mode === 'mt' || mode === 'full') && textToTranslate) {
      const translation = await translateText(textToTranslate, sourceLanguage, targetLanguage);
      response.translation = translation;
    }

    // Step 3: Text-to-Speech (if translation available)
    if ((mode === 'tts' || mode === 'full') && response.translation) {
      const ttsAudio = await textToSpeech(response.translation, targetLanguage);
      response.audioBase64 = ttsAudio;
    }

    response.latencyMs = Date.now() - startTime;

    return NextResponse.json(response);

  } catch (error) {
    console.error('[TranslateStream] Error:', error);
    return NextResponse.json({
      error: 'Translation pipeline failed',
      latencyMs: Date.now() - startTime,
    }, { status: 500 });
  }
}

/**
 * Speech-to-Text using OpenAI Whisper API
 */
async function speechToText(audioBase64: string, language: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Mock response for demo
    console.warn('[STT] No API key, returning mock transcript');
    return `[Mock Transcript in ${language}]`;
  }

  try {
    // Convert base64 to Blob
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', LANGUAGE_MAP[language]?.whisper || 'auto');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const result = await response.json();
    return result.text;

  } catch (error) {
    console.error('[STT] Whisper API error:', error);
    throw error;
  }
}

/**
 * Machine Translation using GPT-4o
 */
async function translateText(
  text: string, 
  sourceLanguage: string, 
  targetLanguage: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Mock response for demo
    console.warn('[MT] No API key, returning mock translation');
    return `[Translated to ${targetLanguage}]: ${text}`;
  }

  try {
    const sourceLang = LANGUAGE_MAP[sourceLanguage]?.gpt || sourceLanguage;
    const targetLang = LANGUAGE_MAP[targetLanguage]?.gpt || targetLanguage;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional medical interpreter. Translate the following ${sourceLang} text to ${targetLang}. 
            
Rules:
1. Translate medical terms accurately but keep the tone friendly and conversational.
2. Preserve the speaker's emotional intent (concerned, reassuring, etc.).
3. If a medical term has no direct translation, provide the closest equivalent with a brief explanation.
4. Do NOT add any notes or explanations - output ONLY the translation.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`GPT API error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();

  } catch (error) {
    console.error('[MT] GPT API error:', error);
    throw error;
  }
}

/**
 * Text-to-Speech using OpenAI TTS API
 */
async function textToSpeech(text: string, language: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Mock response for demo
    console.warn('[TTS] No API key, returning empty audio');
    return '';
  }

  try {
    // Select voice based on language
    const voice = getVoiceForLanguage(language);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer).toString('base64');

  } catch (error) {
    console.error('[TTS] OpenAI TTS error:', error);
    throw error;
  }
}

/**
 * Select appropriate TTS voice based on language
 */
function getVoiceForLanguage(language: string): string {
  // OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
  const voiceMap: Record<string, string> = {
    'ko-KR': 'nova',      // Warm, friendly
    'en-US': 'alloy',     // Neutral
    'en-GB': 'fable',     // British accent
    'ja-JP': 'shimmer',   // Soft
    'zh-CN': 'nova',
    'es-ES': 'alloy',
    'fr-FR': 'fable',
    'de-DE': 'onyx',      // Deep, authoritative
  };

  return voiceMap[language] || 'alloy';
}

// ============================================
// WEBSOCKET HANDLER (for real-time streaming)
// Note: Next.js doesn't natively support WebSocket
// In production, use a separate WebSocket server (e.g., Node.js + ws)
// ============================================

export async function GET() {
  return NextResponse.json({
    message: 'WebSocket endpoint for real-time translation',
    note: 'For production, deploy a dedicated WebSocket server',
    documentation: 'https://docs.manpasik.com/api/translate-stream',
    protocols: ['wss'],
    capabilities: {
      stt: 'OpenAI Whisper',
      mt: 'GPT-4o',
      tts: 'OpenAI TTS / ElevenLabs',
    },
  });
}






