"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Interactive Tutorial Engine
 * "Shadow Mode" - AI Tutor overlays instructions on any app screen
 */

interface TutorialStep {
  id: string;
  targetSelector: string;
  title: string;
  message: string;
  action?: string;
  position?: "top" | "bottom" | "left" | "right";
  points: number;
}

interface TutorialSequence {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  badge?: string;
  steps: TutorialStep[];
}

interface TutorialContextType {
  // Current state
  isActive: boolean;
  currentSequence: TutorialSequence | null;
  currentStepIndex: number;
  
  // Actions
  startTutorial: (sequenceId: string) => void;
  nextStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  
  // Points
  earnedPoints: number;
  totalPointsThisSession: number;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

/**
 * Pre-defined Tutorial Sequences
 */
const TUTORIAL_SEQUENCES: Record<string, TutorialSequence> = {
  "getting-started": {
    id: "getting-started",
    name: "Getting Started",
    nameKo: "시작하기",
    description: "만파식 앱의 기본 사용법을 배웁니다",
    badge: "🎓 신입생",
    steps: [
      {
        id: "welcome",
        targetSelector: "[data-tutorial='dashboard']",
        title: "만파식에 오신 것을 환영합니다!",
        message: "이 대시보드에서 건강 상태를 한눈에 확인할 수 있습니다.",
        position: "bottom",
        points: 5
      },
      {
        id: "health-score",
        targetSelector: "[data-tutorial='health-score']",
        title: "건강 점수",
        message: "이 원형 게이지는 현재 건강 상태를 0-100으로 표시합니다. 80점 이상이면 'Excellent'입니다!",
        position: "bottom",
        points: 5
      },
      {
        id: "measure-button",
        targetSelector: "[data-tutorial='measure-btn']",
        title: "측정 시작",
        message: "이 버튼을 눌러 새로운 측정을 시작할 수 있습니다.",
        action: "click",
        position: "top",
        points: 10
      },
      {
        id: "ai-coach",
        targetSelector: "[data-tutorial='ai-coach']",
        title: "AI 코치",
        message: "AI 코치에게 건강 관련 질문을 해보세요. 개인화된 조언을 받을 수 있습니다.",
        position: "left",
        points: 5
      },
      {
        id: "complete",
        targetSelector: "[data-tutorial='dashboard']",
        title: "축하합니다! 🎉",
        message: "기본 튜토리얼을 완료했습니다. 25 포인트를 획득했습니다!",
        position: "bottom",
        points: 0
      }
    ]
  },
  "cartridge-scan": {
    id: "cartridge-scan",
    name: "Cartridge Scanning",
    nameKo: "카트리지 스캔",
    description: "카트리지를 스캔하고 인증하는 방법",
    badge: "🧪 카트리지 전문가",
    steps: [
      {
        id: "intro",
        targetSelector: "[data-tutorial='scanner']",
        title: "카트리지 스캐너",
        message: "QR 코드를 스캔하여 정품 카트리지를 인증합니다.",
        position: "bottom",
        points: 5
      },
      {
        id: "qr-scan",
        targetSelector: "[data-tutorial='qr-area']",
        title: "QR 코드 위치",
        message: "카트리지 패키지의 QR 코드를 이 영역에 맞춰주세요.",
        action: "scan",
        position: "bottom",
        points: 10
      },
      {
        id: "verify",
        targetSelector: "[data-tutorial='cartridge-status']",
        title: "인증 완료",
        message: "카트리지가 인증되면 여기에 상태가 표시됩니다.",
        position: "top",
        points: 5
      }
    ]
  },
  "ehd-mode": {
    id: "ehd-mode",
    name: "EHD Gas Mode",
    nameKo: "EHD 가스 모드",
    description: "Electrohydrodynamic 가스 센싱 기능",
    steps: [
      {
        id: "mode-switch",
        targetSelector: "[data-tutorial='mode-switch']",
        title: "모드 전환",
        message: "이 버튼을 눌러 EHD 가스 모드로 전환합니다.",
        action: "click",
        position: "right",
        points: 5
      },
      {
        id: "suction",
        targetSelector: "[data-tutorial='suction-indicator']",
        title: "가스 흡입",
        message: "좋습니다! 이제 기기가 주변 공기를 분석합니다.",
        position: "bottom",
        points: 10
      }
    ]
  }
};

/**
 * Tutorial Provider Component
 */
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentSequence, setCurrentSequence] = useState<TutorialSequence | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPointsThisSession, setTotalPointsThisSession] = useState(0);

  const startTutorial = useCallback((sequenceId: string) => {
    const sequence = TUTORIAL_SEQUENCES[sequenceId];
    if (sequence) {
      setCurrentSequence(sequence);
      setCurrentStepIndex(0);
      setEarnedPoints(0);
      setIsActive(true);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (!currentSequence) return;
    
    const currentStep = currentSequence.steps[currentStepIndex];
    if (currentStep) {
      setEarnedPoints(prev => prev + currentStep.points);
      setTotalPointsThisSession(prev => prev + currentStep.points);
    }
    
    if (currentStepIndex < currentSequence.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeTutorial();
    }
  }, [currentSequence, currentStepIndex]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentSequence(null);
    setCurrentStepIndex(0);
  }, []);

  const completeTutorial = useCallback(() => {
    // Save completion to localStorage
    if (currentSequence) {
      const completedTutorials = JSON.parse(
        localStorage.getItem("manpasik:completed-tutorials") || "[]"
      );
      if (!completedTutorials.includes(currentSequence.id)) {
        completedTutorials.push(currentSequence.id);
        localStorage.setItem(
          "manpasik:completed-tutorials",
          JSON.stringify(completedTutorials)
        );
      }
    }
    
    setIsActive(false);
    setCurrentSequence(null);
    setCurrentStepIndex(0);
  }, [currentSequence]);

  const currentStep = currentSequence?.steps[currentStepIndex];

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentSequence,
        currentStepIndex,
        startTutorial,
        nextStep,
        skipTutorial,
        completeTutorial,
        earnedPoints,
        totalPointsThisSession
      }}
    >
      {children}
      
      {/* Tutorial Overlay */}
      <AnimatePresence>
        {isActive && currentStep && (
          <TutorialOverlay
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={currentSequence?.steps.length || 0}
            earnedPoints={earnedPoints}
            onNext={nextStep}
            onSkip={skipTutorial}
          />
        )}
      </AnimatePresence>
    </TutorialContext.Provider>
  );
}

/**
 * Tutorial Overlay Component
 */
function TutorialOverlay({
  step,
  stepIndex,
  totalSteps,
  earnedPoints,
  onNext,
  onSkip
}: {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  earnedPoints: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateTargetPosition = () => {
      const target = document.querySelector(step.targetSelector);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    };
    
    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition);
    
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [step.targetSelector]);

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    
    const padding = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    
    switch (step.position) {
      case "top":
        return {
          top: targetRect.top - tooltipHeight - padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        };
      case "bottom":
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - padding
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + padding
        };
      default:
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <motion.div
      className="fixed inset-0 z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop with spotlight */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm">
        {targetRect && (
          <div
            className="absolute rounded-xl ring-4 ring-sky-500 ring-offset-4 ring-offset-black/60"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <motion.div
        className="absolute w-80 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          top: typeof tooltipPosition.top === 'number' ? tooltipPosition.top : tooltipPosition.top,
          left: typeof tooltipPosition.left === 'number' ? tooltipPosition.left : tooltipPosition.left,
          transform: (tooltipPosition as any).transform
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-white/50">
              {stepIndex + 1} / {totalSteps}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-white/70 mb-4">
            {step.message}
          </p>
          
          {/* Points reward preview */}
          {step.points > 0 && (
            <div className="flex items-center gap-2 text-amber-400 text-sm mb-4">
              <Award className="w-4 h-4" />
              <span>+{step.points} 포인트</span>
            </div>
          )}
          
          {/* Action hint */}
          {step.action && (
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300 text-sm mb-4">
              💡 {step.action === "click" && "버튼을 클릭해보세요"}
              {step.action === "scan" && "QR 코드를 스캔해보세요"}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
          <div className="text-sm text-white/50">
            획득: <span className="text-amber-400 font-medium">{earnedPoints}</span> 포인트
          </div>
          <Button
            size="sm"
            onClick={onNext}
            className="bg-gradient-to-r from-sky-500 to-blue-600"
          >
            {stepIndex === totalSteps - 1 ? "완료" : "다음"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Hook to use Tutorial Context
 */
export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within TutorialProvider");
  }
  return context;
}

/**
 * Trigger Tutorial Button Component
 */
export function TutorialTrigger({
  sequenceId,
  children,
  className
}: {
  sequenceId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { startTutorial } = useTutorial();
  
  return (
    <button
      onClick={() => startTutorial(sequenceId)}
      className={className}
    >
      {children}
    </button>
  );
}






