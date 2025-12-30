"use client";

import React from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { FloatingSystemStatus } from "./SystemStatus";
import { AppToastProvider } from "./AppToast";
import { auditLogger } from "@/lib/audit-logger";
import { SystemLockOverlay } from "./SystemLockOverlay";
import { AuthProvider } from "./AuthProvider";
import { MedicationReminderAgent } from "./MedicationReminderAgent";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
// 41-Persona Simulation에서 도출된 접근성 모듈
import { SeniorModeProvider } from "@/components/accessibility/SeniorModeProvider";
import { KidsModeProvider } from "@/components/accessibility/KidsModeProvider";
// Manpasik Mate - Voice-Enabled AI Companion
import { MateProvider } from "@/components/mate/MateProvider";
// i18n (Internationalization) Provider
import { I18nProvider } from "@/lib/i18n";
// Observability & Monitoring
import { MonitoringProvider } from "@/lib/observability";

interface ClientLayoutProps {
  children: React.ReactNode;
}

// 키즈 모드 래퍼 - 설정에서 kidsMode 상태를 읽어 적용
function KidsModeWrapper({ children }: { children: React.ReactNode }) {
  const { kidsMode } = useSettings();
  return (
    <KidsModeProvider isActive={kidsMode}>
      {children}
    </KidsModeProvider>
  );
}

/**
 * Client Layout Wrapper
 * 
 * - Global Error Boundary로 전체 앱 감싸기
 * - Floating System Status 표시
 */
export function ClientLayout({ children }: ClientLayoutProps) {
  const [locked, setLocked] = React.useState(() => auditLogger.getSystemLock());

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // If already locked from a prior breach, keep locked.
      const existing = auditLogger.getSystemLock();
      if (existing.locked) {
        if (!cancelled) setLocked(existing);
        return;
      }

      const verify = await auditLogger.verifyChain();
      if (!verify.ok) {
        auditLogger.lockSystem(true, verify.message);
        if (!cancelled) setLocked({ locked: true, reason: verify.message, ts: Date.now() });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
        {/* I18nProvider: 다국어 지원 - 모든 UI 컴포넌트보다 상위에 위치해야 함 */}
        <I18nProvider>
          {/* MonitoringProvider: Sentry, PostHog, Live Chat */}
          <MonitoringProvider>
            <AppToastProvider>
              <ErrorBoundary
                onError={(error, errorInfo) => {
                  // 외부 에러 트래킹 서비스로 전송 가능
                  console.error("[ClientLayout] Global error caught:", {
                    error: error.message,
                    componentStack: errorInfo.componentStack
                  });
                }}
              >
                {/* 41-Persona Simulation: 접근성 모드 */}
                <SeniorModeProvider>
                  <KidsModeWrapper>
                    {/* Manpasik Mate: AI 동반자 시스템 */}
                    <MateProvider>
                      {children}
                    </MateProvider>
                  </KidsModeWrapper>
                </SeniorModeProvider>
                <MedicationReminderAgent />
                <FloatingSystemStatus />
              </ErrorBoundary>
              <SystemLockOverlay open={!!locked.locked} reason={locked.reason} />
            </AppToastProvider>
          </MonitoringProvider>
        </I18nProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default ClientLayout;

