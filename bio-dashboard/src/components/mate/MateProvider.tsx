"use client";

/**
 * ============================================================
 * MANPASIK MATE - CONTEXT PROVIDER
 * Global Mate State Management
 * ============================================================
 */

import * as React from "react";
import { usePathname } from "next/navigation";
import { FloatingMateButton } from "./FloatingMateButton";
import { ScreenInterpreter, ScreenContext, ScreenType, HealthMetrics } from "@/lib/mate/screen-interpreter";
import type { PersonalityType } from "@/lib/mate/screen-interpreter";

interface MateContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  personality: PersonalityType;
  setPersonality: (type: PersonalityType) => void;
  triggerExplanation: () => void;
  triggerBriefing: () => void;
  updateHealthMetrics: (metrics: Partial<HealthMetrics>) => void;
}

const MateContext = React.createContext<MateContextType | null>(null);

export function useMate() {
  const ctx = React.useContext(MateContext);
  if (!ctx) {
    throw new Error("useMate must be used within MateProvider");
  }
  return ctx;
}

interface MateProviderProps {
  children: React.ReactNode;
  defaultEnabled?: boolean;
  defaultPersonality?: PersonalityType;
}

export function MateProvider({
  children,
  defaultEnabled = true,
  defaultPersonality = 'caregiver',
}: MateProviderProps) {
  const pathname = usePathname();
  const [isEnabled, setIsEnabled] = React.useState(defaultEnabled);
  const [personality, setPersonalityState] = React.useState<PersonalityType>(defaultPersonality);
  const [healthMetrics, setHealthMetrics] = React.useState<HealthMetrics>({
    healthScore: 75,
    lactate: 1.5,
    heartRate: 72,
    bloodOxygen: 98,
    temperature: 36.5,
    glucose: 95,
    immunityScore: 85,
    sleepHours: 7,
  });
  const [triggerCount, setTriggerCount] = React.useState(0);

  // Detect current screen type
  const screenType: ScreenType = React.useMemo(() => {
    return ScreenInterpreter.detectScreenType(pathname);
  }, [pathname]);

  // Build screen context
  const screenContext: ScreenContext = React.useMemo(() => {
    const hour = new Date().getHours();
    let timeOfDay: ScreenContext['timeOfDay'] = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 5) timeOfDay = 'night';

    return {
      type: screenType,
      metrics: healthMetrics,
      alerts: [],
      schedules: [
        { time: "14:30", title: "김 원장님 원격 진료" },
        { time: "18:00", title: "저녁 혈당 측정" },
      ],
      cartridgeUsesLeft: 5,
      timeOfDay,
      userName: "사용자",
    };
  }, [screenType, healthMetrics]);

  // Set personality in interpreter
  const setPersonality = React.useCallback((type: PersonalityType) => {
    setPersonalityState(type);
    ScreenInterpreter.setPersonality(type);
  }, []);

  // Update health metrics
  const updateHealthMetrics = React.useCallback((metrics: Partial<HealthMetrics>) => {
    setHealthMetrics(prev => ({ ...prev, ...metrics }));
  }, []);

  // Trigger functions (to be called from other components)
  const triggerExplanation = React.useCallback(() => {
    setTriggerCount(c => c + 1);
  }, []);

  const triggerBriefing = React.useCallback(() => {
    // This will be handled by FloatingMateButton
    setTriggerCount(c => c + 1);
  }, []);

  // Load saved personality
  React.useEffect(() => {
    const saved = localStorage.getItem('mate_personality');
    if (saved && ['sergeant', 'caregiver', 'analyst'].includes(saved)) {
      setPersonality(saved as PersonalityType);
    }
  }, [setPersonality]);

  // Save personality changes
  React.useEffect(() => {
    localStorage.setItem('mate_personality', personality);
  }, [personality]);

  const value: MateContextType = {
    isEnabled,
    setIsEnabled,
    personality,
    setPersonality,
    triggerExplanation,
    triggerBriefing,
    updateHealthMetrics,
  };

  return (
    <MateContext.Provider value={value}>
      {children}
      
      {/* Floating Mate Button - Always visible when enabled */}
      {isEnabled && (
        <FloatingMateButton
          screenContext={screenContext}
          healthScore={healthMetrics.healthScore}
          key={triggerCount} // Force re-render on trigger
        />
      )}
    </MateContext.Provider>
  );
}






