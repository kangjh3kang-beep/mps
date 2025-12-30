"use client";

import * as React from "react";
import { I18nProvider } from "@/lib/i18n";
import { AppNavigationLayout } from "@/components/navigation/AppNavigation";
import { AutoDismissMessage, useAiMessages } from "@/components/navigation/AutoDismissMessage";
import { LanguageSelector } from "@/components/navigation/LanguageSelector";
import { useSettings } from "@/context/SettingsContext";

/**
 * Organic Layout
 * 
 * 새로운 5-Pillar 네비게이션 기반 레이아웃
 * - AI 메시지 자동 사라짐 기능
 * - 언어 선택기 통합
 */
export default function OrganicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { voiceEnabled } = useSettings();
  const { currentMessage, addMessage, dismissCurrent } = useAiMessages({
    defaultDuration: 8000
  });
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  // Demo: 첫 방문 시 환영 메시지
  React.useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("organic-welcome-shown");
    if (!hasSeenWelcome) {
      setTimeout(() => {
        addMessage({
          message: "안녕하세요! 만파식 메이트입니다. 새로운 5-Pillar 네비게이션으로 더 직관적인 건강 관리를 시작해보세요! 💪",
          type: "greeting"
        });
        sessionStorage.setItem("organic-welcome-shown", "true");
      }, 2000);
    }
  }, [addMessage]);

  // TTS 기능 (Web Speech API)
  const handleSpeak = React.useCallback((text: string) => {
    if (!voiceEnabled) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, isSpeaking]);

  return (
    <I18nProvider>
      <AppNavigationLayout
        onQuickAction={(action) => {
          if (action === "mate") {
            addMessage({
              message: "무엇을 도와드릴까요? 건강 상태 확인, 측정 시작, 또는 진료 예약 등 원하시는 것을 말씀해주세요.",
              type: "greeting"
            });
          } else if (action === "emergency") {
            addMessage({
              message: "🚨 긴급 상황입니까? 119 연결 또는 등록된 비상 연락처로 연결할 수 있습니다.",
              type: "alert",
              duration: 15000
            });
          }
        }}
      >
        {children}

        {/* Language Selector - Fixed Position */}
        <div className="fixed top-4 right-4 z-40">
          <LanguageSelector variant="dropdown" showFlag showName />
        </div>

        {/* Auto-Dismiss AI Message */}
        <AutoDismissMessage
          message={currentMessage}
          onDismiss={dismissCurrent}
          onSpeak={voiceEnabled ? handleSpeak : undefined}
          isSpeaking={isSpeaking}
          position="top"
          showProgress
        />
      </AppNavigationLayout>
    </I18nProvider>
  );
}




