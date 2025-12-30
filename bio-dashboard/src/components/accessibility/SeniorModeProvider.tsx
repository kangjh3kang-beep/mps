"use client";

/**
 * ============================================================
 * SENIOR MODE PROVIDER
 * Enhanced Accessibility for Elderly Users (60+)
 * ============================================================
 * 
 * Generated from 41-Persona Simulation
 * Addressing: User #35, #36 - 시니어 접근성 문제
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, HelpCircle, Phone, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceAssistant, narratePageChange } from "@/lib/voice-assistant";
import { useSettings } from "@/context/SettingsContext";

interface SeniorModeContextType {
  isActive: boolean;
  voiceEnabled: boolean;
  toggleVoice: () => void;
  speak: (text: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  showSOSButton: boolean;
  triggerSOS: () => void;
}

const SeniorModeContext = React.createContext<SeniorModeContextType | null>(null);

export function useSeniorMode() {
  const ctx = React.useContext(SeniorModeContext);
  if (!ctx) throw new Error("useSeniorMode must be used within SeniorModeProvider");
  return ctx;
}

// ============================================
// SOS MODAL
// ============================================

function SOSModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [countdown, setCountdown] = React.useState(10);
  const [called, setCalled] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setCountdown(10);
      setCalled(false);
      return;
    }

    voiceAssistant?.speak("응급 호출을 시작합니다. 10초 후 보호자에게 연락됩니다. 취소하려면 취소 버튼을 누르세요.");

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCalled(true);
          voiceAssistant?.speak("보호자에게 연락 중입니다. 잠시만 기다려주세요.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-red-600/95 flex flex-col items-center justify-center p-8"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="text-center text-white"
      >
        <Phone className="w-24 h-24 mx-auto mb-6 animate-pulse" />
        
        {!called ? (
          <>
            <h1 className="text-4xl font-bold mb-4">
              응급 호출
            </h1>
            <p className="text-2xl mb-8">
              {countdown}초 후 보호자에게 연락됩니다
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={onClose}
              className="text-2xl px-12 py-8 h-auto bg-white text-red-600 hover:bg-gray-100"
            >
              취소하기
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4">
              연락 중...
            </h1>
            <p className="text-2xl mb-8">
              보호자: 홍길동 (010-1234-5678)
            </p>
            <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto" />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// FLOATING SENIOR CONTROLS
// ============================================

function FloatingSeniorControls() {
  const { 
    voiceEnabled, 
    toggleVoice, 
    isListening, 
    startListening, 
    stopListening,
    triggerSOS 
  } = useSeniorMode();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 right-4 z-50 flex flex-col gap-3"
    >
      {/* 음성 인식 버튼 */}
      <Button
        size="lg"
        onClick={isListening ? stopListening : startListening}
        className={`
          w-16 h-16 rounded-full shadow-2xl
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-primary hover:bg-primary/90'
          }
        `}
        aria-label={isListening ? "음성 인식 중지" : "음성 명령 시작"}
      >
        {isListening ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </Button>

      {/* 음성 안내 토글 */}
      <Button
        size="lg"
        variant={voiceEnabled ? "default" : "outline"}
        onClick={toggleVoice}
        className="w-16 h-16 rounded-full shadow-2xl"
        aria-label={voiceEnabled ? "음성 안내 끄기" : "음성 안내 켜기"}
      >
        <Volume2 className={`w-8 h-8 ${voiceEnabled ? 'text-white' : ''}`} />
      </Button>

      {/* 도움말 */}
      <Button
        size="lg"
        variant="outline"
        onClick={() => voiceAssistant?.speak("측정, 결과, 설정, 또는 응급이라고 말씀하시면 해당 기능으로 이동합니다.")}
        className="w-16 h-16 rounded-full shadow-2xl bg-white"
        aria-label="도움말"
      >
        <HelpCircle className="w-8 h-8 text-gray-700" />
      </Button>

      {/* SOS 버튼 */}
      <Button
        size="lg"
        onClick={triggerSOS}
        className="w-16 h-16 rounded-full shadow-2xl bg-red-600 hover:bg-red-700"
        aria-label="응급 호출"
      >
        <span className="text-white font-bold text-lg">SOS</span>
      </Button>
    </motion.div>
  );
}

// ============================================
// SENIOR NAVIGATION BAR
// ============================================

function SeniorNavigationBar() {
  const handleNavigate = (path: string, name: string) => {
    voiceAssistant?.speak(`${name} 화면으로 이동합니다.`);
    window.location.href = path;
  };

  const navItems = [
    { path: '/', name: '홈', icon: () => <Home className="w-10 h-10 text-gray-700" /> },
    { path: '/result', name: '결과', icon: () => <span className="text-2xl">📊</span> },
    { path: '/store/products', name: '쇼핑', icon: () => <span className="text-2xl">🛒</span> },
    { path: '/settings', name: '설정', icon: () => <span className="text-2xl">⚙️</span> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-gray-200 shadow-2xl">
      <div className="flex justify-around py-2">
        {navItems.map(({ path, name, icon: IconComponent }) => (
          <button
            key={path}
            onClick={() => handleNavigate(path, name)}
            className="flex flex-col items-center justify-center p-4 min-w-[80px] hover:bg-gray-100 rounded-xl transition-colors"
          >
            <IconComponent />
            <span className="text-lg font-semibold mt-1">{name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ============================================
// PROVIDER
// ============================================

export function SeniorModeProvider({ children }: { children: React.ReactNode }) {
  const settingsCtx = useSettings();
  const [voiceEnabled, setVoiceEnabled] = React.useState(true);
  const [isListening, setIsListening] = React.useState(false);
  const [showSOS, setShowSOS] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  // Hydration fix: 클라이언트에서만 렌더링
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const isActive = hasMounted && settingsCtx.seniorMode;

  // 음성 안내 활성화 시 환영 메시지
  React.useEffect(() => {
    if (isActive && voiceEnabled) {
      narratePageChange("만파식 헬스");
    }
  }, [isActive, voiceEnabled]);

  // SOS 이벤트 리스너
  React.useEffect(() => {
    const handleSOS = () => setShowSOS(true);
    window.addEventListener('manpasik:sos', handleSOS);
    return () => window.removeEventListener('manpasik:sos', handleSOS);
  }, []);

  const toggleVoice = React.useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev;
      if (next) {
        voiceAssistant?.speak("음성 안내가 켜졌습니다.");
      }
      return next;
    });
  }, []);

  const speak = React.useCallback((text: string) => {
    if (voiceEnabled) {
      voiceAssistant?.speak(text);
    }
  }, [voiceEnabled]);

  const startListening = React.useCallback(() => {
    setIsListening(true);
    voiceAssistant?.speak("네, 말씀하세요.", { rate: 1.0 });
    setTimeout(() => {
      voiceAssistant?.startListening((cmd) => {
        console.log('[SeniorMode] Command received:', cmd);
        setIsListening(false);
      });
    }, 1000);
  }, []);

  const stopListening = React.useCallback(() => {
    voiceAssistant?.stopListening();
    setIsListening(false);
  }, []);

  const triggerSOS = React.useCallback(() => {
    setShowSOS(true);
  }, []);

  const value: SeniorModeContextType = {
    isActive,
    voiceEnabled,
    toggleVoice,
    speak,
    isListening,
    startListening,
    stopListening,
    showSOSButton: isActive,
    triggerSOS,
  };

  return (
    <SeniorModeContext.Provider value={value}>
      {/* 시니어 모드 스타일 오버레이 */}
      {isActive && (
        <style jsx global>{`
          /* 시니어 모드: 큰 폰트, 큰 버튼 */
          body {
            font-size: 18px !important;
          }
          
          button, a {
            min-height: 48px !important;
            min-width: 48px !important;
          }
          
          input, select, textarea {
            font-size: 18px !important;
            padding: 16px !important;
          }
          
          /* 대비 강화 */
          .text-muted-foreground {
            color: #374151 !important;
          }
          
          /* 포커스 링 강화 */
          *:focus {
            outline: 4px solid #3B82F6 !important;
            outline-offset: 2px !important;
          }
        `}</style>
      )}

      {children}

      <AnimatePresence>
        {isActive && <FloatingSeniorControls />}
      </AnimatePresence>

      {isActive && <SeniorNavigationBar />}

      <AnimatePresence>
        {showSOS && (
          <SOSModal isOpen={showSOS} onClose={() => setShowSOS(false)} />
        )}
      </AnimatePresence>
    </SeniorModeContext.Provider>
  );
}

