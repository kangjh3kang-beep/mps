"use client";

/**
 * ============================================================
 * MANPASIK MATE - PROACTIVE NUDGE SYSTEM
 * Lunchtime Interceptor & Cartridge Manager
 * ============================================================
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Utensils, 
  MapPin, 
  Package, 
  ShoppingCart, 
  X,
  ExternalLink,
  Coins
} from "lucide-react";
import { ManpasikAvatar } from "./ManpasikAvatar";
import { ScreenInterpreter } from "@/lib/mate/screen-interpreter";
import { useVoiceManager } from "@/lib/mate/voice-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================
// LUNCHTIME INTERCEPTOR
// ============================================

interface LunchtimeInterceptorProps {
  morningGlucose: number;
  isVisible: boolean;
  onDismiss: () => void;
  onFindRestaurant?: () => void;
}

export function LunchtimeInterceptor({
  morningGlucose,
  isVisible,
  onDismiss,
  onFindRestaurant,
}: LunchtimeInterceptorProps) {
  const { speak, isSpeaking } = useVoiceManager();
  const [hasSpoken, setHasSpoken] = React.useState(false);

  const advice = React.useMemo(() => 
    ScreenInterpreter.generateLunchtimeAdvice(morningGlucose),
    [morningGlucose]
  );

  React.useEffect(() => {
    if (isVisible && !hasSpoken) {
      speak(advice.text, advice.emotion);
      setHasSpoken(true);
    }
  }, [isVisible, hasSpoken, advice, speak]);

  const isHighGlucose = morningGlucose > 120;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-32 left-4 right-4 z-[70] max-w-md mx-auto"
        >
          <Card className={cn(
            "border-2 shadow-2xl backdrop-blur-xl",
            isHighGlucose ? "border-amber-300 bg-amber-50/98" : "border-green-300 bg-green-50/98"
          )}>
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <ManpasikAvatar
                  expression={isHighGlucose ? 'worried' : 'happy'}
                  size="sm"
                  isSpeaking={isSpeaking}
                />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      점심 시간이에요!
                    </h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {advice.text}
                  </p>
                </div>
              </div>

              {/* Morning glucose info */}
              <div className={cn(
                "mt-3 p-2 rounded-lg text-xs flex items-center justify-between",
                isHighGlucose ? "bg-amber-100" : "bg-green-100"
              )}>
                <span>오늘 아침 혈당</span>
                <span className={cn(
                  "font-bold",
                  isHighGlucose ? "text-amber-700" : "text-green-700"
                )}>
                  {morningGlucose} mg/dL
                </span>
              </div>

              {/* Restaurant suggestion */}
              {isHighGlucose && (
                <Button
                  onClick={onFindRestaurant}
                  className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  근처 건강식 맛집 보기
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// CARTRIDGE MANAGER
// ============================================

interface CartridgeManagerProps {
  usesLeft: number;
  pointsBalance: number;
  isVisible: boolean;
  onDismiss: () => void;
  onOrderCartridge?: () => void;
}

export function CartridgeManager({
  usesLeft,
  pointsBalance,
  isVisible,
  onDismiss,
  onOrderCartridge,
}: CartridgeManagerProps) {
  const { speak, isSpeaking } = useVoiceManager();
  const [hasSpoken, setHasSpoken] = React.useState(false);
  const [isOrdering, setIsOrdering] = React.useState(false);

  const cartridgePrice = 500; // points
  const canAfford = pointsBalance >= cartridgePrice;

  const alert = React.useMemo(() => 
    ScreenInterpreter.generateCartridgeAlert(usesLeft, pointsBalance),
    [usesLeft, pointsBalance]
  );

  React.useEffect(() => {
    if (isVisible && !hasSpoken && usesLeft <= 3) {
      speak(alert.text, alert.emotion);
      setHasSpoken(true);
    }
  }, [isVisible, hasSpoken, alert, speak, usesLeft]);

  const handleOrder = async () => {
    setIsOrdering(true);
    await speak("네, 카트리지를 주문할게요. 잠시만요!", 'happy');
    
    // Simulate order
    setTimeout(() => {
      onOrderCartridge?.();
      setIsOrdering(false);
    }, 1500);
  };

  const getUrgencyColor = () => {
    if (usesLeft <= 1) return "border-red-300 bg-red-50";
    if (usesLeft <= 3) return "border-amber-300 bg-amber-50";
    return "border-blue-300 bg-blue-50";
  };

  const getProgressColor = () => {
    if (usesLeft <= 1) return "bg-red-500";
    if (usesLeft <= 3) return "bg-amber-500";
    return "bg-blue-500";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-32 left-4 right-4 z-[70] max-w-md mx-auto"
        >
          <Card className={cn("border-2 shadow-2xl", getUrgencyColor())}>
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <ManpasikAvatar
                  expression={usesLeft <= 1 ? 'worried' : 'neutral'}
                  size="sm"
                  isSpeaking={isSpeaking}
                />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      카트리지 알림
                    </h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.text}
                  </p>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>잔여 사용 횟수</span>
                  <span className="font-bold">{usesLeft}회</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", getProgressColor())}
                    initial={{ width: "100%" }}
                    animate={{ width: `${(usesLeft / 10) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Points Balance */}
              <div className="mt-3 p-2 rounded-lg bg-white/50 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-500" />
                  보유 포인트
                </span>
                <span className="font-bold">{pointsBalance.toLocaleString()} P</span>
              </div>

              {/* Order Button */}
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  onClick={onDismiss}
                  className="flex-1"
                >
                  나중에
                </Button>
                <Button
                  onClick={handleOrder}
                  disabled={!canAfford || isOrdering}
                  className={cn(
                    "flex-1",
                    canAfford 
                      ? "bg-gradient-to-r from-primary to-secondary" 
                      : "bg-slate-400"
                  )}
                >
                  {isOrdering ? (
                    "주문 중..."
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      지금 주문 ({cartridgePrice}P)
                    </>
                  )}
                </Button>
              </div>

              {!canAfford && (
                <p className="text-xs text-center text-red-500 mt-2">
                  포인트가 부족해요. 쇼핑몰에서 충전해주세요!
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// NUDGE SCHEDULER HOOK
// ============================================

interface NudgeState {
  showLunchtime: boolean;
  showCartridge: boolean;
}

export function useProactiveNudge(config: {
  morningGlucose?: number;
  cartridgeUsesLeft?: number;
  pointsBalance?: number;
}) {
  const [nudgeState, setNudgeState] = React.useState<NudgeState>({
    showLunchtime: false,
    showCartridge: false,
  });

  // Lunchtime check (11:50 AM - 12:30 PM)
  React.useEffect(() => {
    const checkLunchtime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      // Show between 11:50 and 12:30
      if ((hour === 11 && minute >= 50) || (hour === 12 && minute <= 30)) {
        const dismissed = localStorage.getItem(`lunch_dismissed_${now.toDateString()}`);
        if (!dismissed && config.morningGlucose !== undefined) {
          setNudgeState(prev => ({ ...prev, showLunchtime: true }));
        }
      }
    };

    checkLunchtime();
    const interval = setInterval(checkLunchtime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [config.morningGlucose]);

  // Cartridge check (when usesLeft <= 3)
  React.useEffect(() => {
    if (config.cartridgeUsesLeft !== undefined && config.cartridgeUsesLeft <= 3) {
      const dismissed = localStorage.getItem('cartridge_dismissed');
      const lastDismissed = dismissed ? new Date(dismissed) : null;
      const hoursSinceDismissed = lastDismissed 
        ? (Date.now() - lastDismissed.getTime()) / (1000 * 60 * 60)
        : Infinity;

      // Show if not dismissed or dismissed more than 24 hours ago
      if (hoursSinceDismissed > 24) {
        setNudgeState(prev => ({ ...prev, showCartridge: true }));
      }
    }
  }, [config.cartridgeUsesLeft]);

  const dismissLunchtime = () => {
    localStorage.setItem(`lunch_dismissed_${new Date().toDateString()}`, 'true');
    setNudgeState(prev => ({ ...prev, showLunchtime: false }));
  };

  const dismissCartridge = () => {
    localStorage.setItem('cartridge_dismissed', new Date().toISOString());
    setNudgeState(prev => ({ ...prev, showCartridge: false }));
  };

  return {
    ...nudgeState,
    dismissLunchtime,
    dismissCartridge,
    morningGlucose: config.morningGlucose ?? 100,
    cartridgeUsesLeft: config.cartridgeUsesLeft ?? 10,
    pointsBalance: config.pointsBalance ?? 1000,
  };
}





