"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Stethoscope, 
  ShoppingBag, 
  GraduationCap,
  Activity,
  Sparkles,
  X,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ============================================
 * Bridge Types & Context Definitions
 * ============================================ */

export type BridgeContext = 
  | "result-to-care"      // 분석 결과 → 케어 (진료/쇼핑)
  | "twin-to-action"      // 프로필 → 행동 추천
  | "school-to-measure"   // 교육 → 측정
  | "care-to-analyze"     // 케어 → 재측정
  | "home-to-analyze"     // 홈 → 측정
  | "custom";

export interface BridgeConfig {
  context: BridgeContext;
  title: string;
  description: string;
  primaryAction: {
    label: string;
    path: string;
    icon?: React.ElementType;
  };
  secondaryAction?: {
    label: string;
    path: string;
    icon?: React.ElementType;
  };
  theme: "doctor" | "shop" | "measure" | "learn" | "default";
  dismissible?: boolean;
}

/* ============================================
 * Bridge Presets
 * ============================================ */

export const BRIDGE_PRESETS: Record<string, Omit<BridgeConfig, "context">> = {
  "inflammation-high": {
    title: "염증 수치가 높습니다",
    description: "염증 전문의 김 원장님과 상담하시겠어요?",
    primaryAction: {
      label: "진료 예약",
      path: "/care/telemedicine?specialty=inflammation",
      icon: Stethoscope
    },
    secondaryAction: {
      label: "염증 완화 제품 보기",
      path: "/care/mall?category=inflammation",
      icon: ShoppingBag
    },
    theme: "doctor"
  },
  "glucose-high": {
    title: "혈당 관리가 필요해요",
    description: "당뇨 전문의 상담 또는 혈당 관리 제품을 추천드려요",
    primaryAction: {
      label: "내분비내과 예약",
      path: "/care/telemedicine?specialty=diabetes",
      icon: Stethoscope
    },
    secondaryAction: {
      label: "저당 간식 보기",
      path: "/care/mall?category=diabetes",
      icon: ShoppingBag
    },
    theme: "doctor"
  },
  "tutorial-complete": {
    title: "튜토리얼 완료! 🎉",
    description: "배운 내용을 직접 측정해보세요",
    primaryAction: {
      label: "지금 측정하기",
      path: "/analyze?mode=quick",
      icon: Activity
    },
    theme: "measure"
  },
  "goal-updated": {
    title: "목표가 업데이트되었어요",
    description: "AI 코치 페르소나를 목표에 맞게 변경할까요?",
    primaryAction: {
      label: "코치 설정",
      path: "/me/coach-settings",
      icon: Sparkles
    },
    secondaryAction: {
      label: "관련 제품 보기",
      path: "/care/mall?category=goal",
      icon: ShoppingBag
    },
    theme: "default"
  },
  "cartridge-low": {
    title: "카트리지가 곧 소진됩니다",
    description: "3회 분량만 남았어요. 미리 주문하시겠어요?",
    primaryAction: {
      label: "카트리지 구매",
      path: "/care/mall?category=cartridge",
      icon: ShoppingBag
    },
    theme: "shop"
  }
};

/* ============================================
 * Theme Configurations
 * ============================================ */

const THEME_STYLES: Record<BridgeConfig["theme"], {
  bg: string;
  border: string;
  icon: string;
  gradient: string;
}> = {
  doctor: {
    bg: "bg-gradient-to-r from-rose-50 to-pink-50",
    border: "border-rose-200/50",
    icon: "text-rose-500",
    gradient: "from-rose-500 to-pink-500"
  },
  shop: {
    bg: "bg-gradient-to-r from-amber-50 to-orange-50",
    border: "border-amber-200/50",
    icon: "text-amber-500",
    gradient: "from-amber-500 to-orange-500"
  },
  measure: {
    bg: "bg-gradient-to-r from-emerald-50 to-teal-50",
    border: "border-emerald-200/50",
    icon: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-500"
  },
  learn: {
    bg: "bg-gradient-to-r from-violet-50 to-purple-50",
    border: "border-violet-200/50",
    icon: "text-violet-500",
    gradient: "from-violet-500 to-purple-500"
  },
  default: {
    bg: "bg-gradient-to-r from-sky-50 to-blue-50",
    border: "border-sky-200/50",
    icon: "text-sky-500",
    gradient: "from-sky-500 to-blue-500"
  }
};

/* ============================================
 * Bridge Button Component (Floating Card)
 * ============================================ */

interface BridgeButtonProps {
  config: BridgeConfig;
  isVisible?: boolean;
  position?: "bottom" | "top" | "inline";
  onDismiss?: () => void;
  className?: string;
}

export function BridgeButton({ 
  config, 
  isVisible = true,
  position = "bottom",
  onDismiss,
  className 
}: BridgeButtonProps) {
  const router = useRouter();
  const theme = THEME_STYLES[config.theme];

  const handlePrimaryAction = () => {
    router.push(config.primaryAction.path);
  };

  const handleSecondaryAction = () => {
    if (config.secondaryAction) {
      router.push(config.secondaryAction.path);
    }
  };

  const positionClasses = {
    bottom: "fixed bottom-24 left-4 right-4 max-w-lg mx-auto z-30",
    top: "fixed top-20 left-4 right-4 max-w-lg mx-auto z-30",
    inline: "relative w-full"
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -20 : 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "top" ? -20 : 20, scale: 0.95 }}
          className={cn(positionClasses[position], className)}
        >
          <div className={cn(
            "relative rounded-2xl border p-4 shadow-lg backdrop-blur-sm",
            theme.bg,
            theme.border
          )}>
            {/* Dismiss Button */}
            {config.dismissible !== false && onDismiss && (
              <button
                onClick={onDismiss}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {/* Content */}
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                "bg-gradient-to-br",
                theme.gradient
              )}>
                {config.primaryAction.icon ? (
                  <config.primaryAction.icon className="w-5 h-5 text-white" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-0.5">
                  {config.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={handlePrimaryAction}
                className={cn(
                  "flex-1 text-xs bg-gradient-to-r text-white shadow-md",
                  theme.gradient
                )}
              >
                {config.primaryAction.label}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>

              {config.secondaryAction && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSecondaryAction}
                  className="flex-1 text-xs"
                >
                  {config.secondaryAction.icon && (
                    <config.secondaryAction.icon className="w-3 h-3 mr-1" />
                  )}
                  {config.secondaryAction.label}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================
 * Context-Aware Bridge Hook
 * ============================================ */

interface BridgeState {
  isVisible: boolean;
  config: BridgeConfig | null;
}

export function useBridge() {
  const [state, setState] = React.useState<BridgeState>({
    isVisible: false,
    config: null
  });

  const showBridge = React.useCallback((config: BridgeConfig) => {
    setState({ isVisible: true, config });
  }, []);

  const showPreset = React.useCallback((presetKey: keyof typeof BRIDGE_PRESETS, context: BridgeContext = "custom") => {
    const preset = BRIDGE_PRESETS[presetKey];
    if (preset) {
      setState({
        isVisible: true,
        config: { ...preset, context }
      });
    }
  }, []);

  const hideBridge = React.useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const dismissBridge = React.useCallback(() => {
    setState({ isVisible: false, config: null });
  }, []);

  return {
    ...state,
    showBridge,
    showPreset,
    hideBridge,
    dismissBridge
  };
}

/* ============================================
 * Inline Bridge Card (Non-floating)
 * ============================================ */

interface InlineBridgeProps {
  presetKey: keyof typeof BRIDGE_PRESETS;
  className?: string;
}

export function InlineBridge({ presetKey, className }: InlineBridgeProps) {
  const preset = BRIDGE_PRESETS[presetKey];
  
  if (!preset) return null;

  return (
    <BridgeButton
      config={{ ...preset, context: "custom" }}
      position="inline"
      className={className}
    />
  );
}

/* ============================================
 * Quick Bridge Links (Simple Version)
 * ============================================ */

interface QuickBridgeLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  color?: string;
  className?: string;
}

export function QuickBridgeLink({ 
  to, 
  icon: Icon, 
  label, 
  color = "sky",
  className 
}: QuickBridgeLinkProps) {
  const router = useRouter();

  const colorClasses: Record<string, string> = {
    sky: "bg-sky-50 text-sky-600 hover:bg-sky-100",
    rose: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    violet: "bg-violet-50 text-violet-600 hover:bg-violet-100"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(to)}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl transition-colors",
        colorClasses[color] || colorClasses.sky,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
      <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
    </motion.button>
  );
}

export default BridgeButton;
