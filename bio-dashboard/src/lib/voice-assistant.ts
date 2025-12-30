/**
 * ============================================================
 * MANPASIK VOICE ASSISTANT
 * AI-Powered Voice Navigation for Senior Mode
 * ============================================================
 * 
 * Generated from 41-Persona Simulation
 * Addressing: User #35 (60대 자영업자), User #36 (70대 은퇴자)
 * Issue: "글씨가 너무 작음", "버튼이 작아 터치 어려움"
 */

// ============================================
// VOICE SYNTHESIS (TTS)
// ============================================

export interface VoiceConfig {
  rate: number;      // 0.1 - 2.0, default 0.8 for seniors
  pitch: number;     // 0 - 2.0, default 1.0
  volume: number;    // 0 - 1.0
  lang: string;      // 'ko-KR', 'en-US'
}

const SENIOR_VOICE_CONFIG: VoiceConfig = {
  rate: 0.8,         // 느린 속도
  pitch: 1.0,
  volume: 1.0,
  lang: 'ko-KR'
};

class VoiceAssistant {
  private synth: SpeechSynthesis | null = null;
  private recognition: SpeechRecognition | null = null;
  private config: VoiceConfig = SENIOR_VOICE_CONFIG;
  private isListening = false;
  private onCommandCallback: ((command: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.initRecognition();
    }
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.lang;
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('[Voice] Recognized:', transcript);
      this.processCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('[Voice] Recognition error:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  /**
   * 텍스트를 음성으로 읽어줌
   */
  speak(text: string, options?: Partial<VoiceConfig>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // 이전 발화 중지
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const config = { ...this.config, ...options };
      
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = config.volume;
      utterance.lang = config.lang;

      // 한국어 음성 선택
      const voices = this.synth.getVoices();
      const koreanVoice = voices.find(v => v.lang.startsWith('ko'));
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      this.synth.speak(utterance);
    });
  }

  /**
   * 음성 인식 시작
   */
  startListening(onCommand?: (command: string) => void): void {
    if (!this.recognition) {
      console.warn('Speech recognition not available');
      return;
    }

    if (this.isListening) return;

    this.onCommandCallback = onCommand ?? null;
    this.isListening = true;
    this.recognition.start();
  }

  /**
   * 음성 인식 중지
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * 음성 명령 처리
   */
  private processCommand(transcript: string): void {
    const command = transcript.toLowerCase().trim();
    
    // 기본 명령어 매핑
    const commands: Record<string, string> = {
      '측정': 'navigate:/measure',
      '측정하기': 'navigate:/measure',
      '결과': 'navigate:/result',
      '결과 보기': 'navigate:/result',
      '홈': 'navigate:/',
      '집': 'navigate:/',
      '설정': 'navigate:/settings',
      '도움말': 'action:help',
      '다시 말해줘': 'action:repeat',
      '뭐라고': 'action:repeat',
      '응급': 'action:emergency',
      '도와줘': 'action:emergency',
      'sos': 'action:emergency',
    };

    // 정확한 매칭 먼저
    if (commands[command]) {
      this.executeCommand(commands[command]);
      return;
    }

    // 부분 매칭
    for (const [key, action] of Object.entries(commands)) {
      if (command.includes(key)) {
        this.executeCommand(action);
        return;
      }
    }

    // 인식 실패 시
    this.speak('죄송해요, 명령을 이해하지 못했어요. 다시 말씀해주세요.');
    
    if (this.onCommandCallback) {
      this.onCommandCallback(command);
    }
  }

  private executeCommand(action: string): void {
    const [type, value] = action.split(':');
    
    if (type === 'navigate' && typeof window !== 'undefined') {
      this.speak(`${value === '/' ? '홈' : value.replace('/', '')} 화면으로 이동합니다.`);
      window.location.href = value;
    } else if (type === 'action') {
      switch (value) {
        case 'help':
          this.speak('측정, 결과, 설정, 또는 응급이라고 말씀하시면 해당 기능으로 이동합니다.');
          break;
        case 'emergency':
          this.speak('응급 상황을 감지했습니다. 보호자에게 연락합니다.');
          // Trigger SOS
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('manpasik:sos'));
          }
          break;
        case 'repeat':
          // Will be handled by the caller
          break;
      }
    }

    if (this.onCommandCallback) {
      this.onCommandCallback(action);
    }
  }

  /**
   * 설정 업데이트
   */
  setConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.recognition) {
      this.recognition.lang = this.config.lang;
    }
  }

  /**
   * 현재 청취 상태
   */
  get listening(): boolean {
    return this.isListening;
  }
}

// 싱글톤 인스턴스
export const voiceAssistant = typeof window !== 'undefined' 
  ? new VoiceAssistant() 
  : null;

// ============================================
// VOICE NARRATION HOOKS
// ============================================

/**
 * 페이지 이동 시 음성 안내
 */
export function narratePageChange(pageName: string): void {
  voiceAssistant?.speak(`${pageName} 페이지입니다.`);
}

/**
 * 측정 결과 음성 안내
 */
export function narrateMeasurementResult(result: {
  healthScore: number;
  mainInsight: string;
}): void {
  const scoreText = result.healthScore >= 80 
    ? '좋은 상태입니다' 
    : result.healthScore >= 60 
      ? '보통 상태입니다' 
      : '주의가 필요합니다';
  
  voiceAssistant?.speak(
    `건강 점수는 ${result.healthScore}점으로 ${scoreText}. ${result.mainInsight}`
  );
}

/**
 * 에러 음성 안내
 */
export function narrateError(message: string): void {
  voiceAssistant?.speak(`오류가 발생했습니다. ${message}`);
}

/**
 * 버튼 클릭 안내
 */
export function narrateButtonClick(buttonName: string): void {
  voiceAssistant?.speak(`${buttonName} 버튼을 눌렀습니다.`, { rate: 1.0 });
}






