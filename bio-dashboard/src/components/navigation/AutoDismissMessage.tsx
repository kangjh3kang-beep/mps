"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

/* ============================================
 * Auto-Dismiss AI Message Component
 * 
 * AI 비서의 메시지가 표시된 후 자동으로 사라지는 기능
 * - 음성 재생이 완료되면 자동 사라짐
 * - 수동 닫기 버튼
 * - 프로그레스 바로 남은 시간 표시
 * ============================================ */

export interface AiMessage {
  id: string;
  message: string;
  type: "greeting" | "insight" | "reminder" | "alert" | "briefing";
  priority?: "low" | "normal" | "high";
  duration?: number; // ms, default 8000
}

interface AutoDismissMessageProps {
  message: AiMessage | null;
  onDismiss: () => void;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  className?: string;
  position?: "top" | "bottom" | "center";
  showProgress?: boolean;
}

export function AutoDismissMessage({
  message,
  onDismiss,
  onSpeak,
  isSpeaking = false,
  className,
  position = "top",
  showProgress = true
}: AutoDismissMessageProps) {
  const { t } = useI18n();
  const [progress, setProgress] = React.useState(100);
  const [isPaused, setIsPaused] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const remainingTimeRef = React.useRef<number>(0);

  const duration = message?.duration || 8000;

  // Start/Resume timer
  const startTimer = React.useCallback(() => {
    if (!message) return;
    
    const remaining = remainingTimeRef.current || duration;
    startTimeRef.current = Date.now();
    remainingTimeRef.current = remaining;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newRemaining = remainingTimeRef.current - elapsed;
      
      if (newRemaining <= 0) {
        onDismiss();
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setProgress((newRemaining / duration) * 100);
      }
    }, 50);
  }, [message, duration, onDismiss]);

  // Pause timer
  const pauseTimer = React.useCallback(() => {
    if (timerRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = remainingTimeRef.current - elapsed;
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Effect: Start timer when message appears
  React.useEffect(() => {
    if (message && !isPaused && !isSpeaking) {
      remainingTimeRef.current = duration;
      setProgress(100);
      startTimer();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [message?.id, startTimer, isPaused, isSpeaking, duration]);

  // Effect: Pause timer when speaking
  React.useEffect(() => {
    if (isSpeaking) {
      pauseTimer();
    } else if (message && !isPaused) {
      startTimer();
    }
  }, [isSpeaking, message, isPaused, startTimer, pauseTimer]);

  // Handle mouse enter/leave for pause
  const handleMouseEnter = () => {
    setIsPaused(true);
    pauseTimer();
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    if (!isSpeaking) startTimer();
  };

  const positionClasses = {
    top: "fixed top-20 left-4 right-4 max-w-lg mx-auto z-50",
    bottom: "fixed bottom-24 left-4 right-4 max-w-lg mx-auto z-50",
    center: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4 z-50"
  };

  const getTypeColor = (type: AiMessage["type"]) => {
    switch (type) {
      case "alert": return "from-rose-500 to-pink-500";
      case "insight": return "from-violet-500 to-purple-500";
      case "reminder": return "from-amber-500 to-orange-500";
      case "briefing": return "from-emerald-500 to-teal-500";
      default: return "from-sky-500 to-blue-500";
    }
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: position === "bottom" ? 20 : -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "bottom" ? 20 : -20, scale: 0.95 }}
          className={cn(positionClasses[position], className)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Card className="overflow-hidden shadow-2xl border-0">
            {/* Progress Bar */}
            {showProgress && (
              <div className="h-1 bg-slate-200">
                <motion.div
                  className={cn("h-full bg-gradient-to-r", getTypeColor(message.type))}
                  initial={{ width: "100%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.05, ease: "linear" }}
                />
              </div>
            )}

            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  "bg-gradient-to-br shadow-lg",
                  getTypeColor(message.type)
                )}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-primary">
                      {t("mate.title")}
                    </span>
                    {isSpeaking && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Speaking...
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {message.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {onSpeak && (
                    <button
                      onClick={() => onSpeak(message.message)}
                      className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                      title={isSpeaking ? "Stop" : "Speak"}
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={onDismiss}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    title={t("mate.dismiss")}
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Pause indicator */}
              {isPaused && (
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  ⏸️ 마우스를 올려두면 메시지가 유지됩니다
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================
 * AI Message Queue Manager Hook
 * ============================================ */

interface UseAiMessagesOptions {
  maxQueue?: number;
  defaultDuration?: number;
}

export function useAiMessages(options: UseAiMessagesOptions = {}) {
  const { maxQueue = 5, defaultDuration = 8000 } = options;
  
  const [queue, setQueue] = React.useState<AiMessage[]>([]);
  const [currentMessage, setCurrentMessage] = React.useState<AiMessage | null>(null);

  // Add message to queue
  const addMessage = React.useCallback((message: Omit<AiMessage, "id">) => {
    const newMessage: AiMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      duration: message.duration || defaultDuration
    };

    setQueue(prev => {
      const updated = [...prev, newMessage];
      return updated.slice(-maxQueue); // Keep only last N messages
    });
  }, [maxQueue, defaultDuration]);

  // Dismiss current message and show next
  const dismissCurrent = React.useCallback(() => {
    setCurrentMessage(null);
    // Next message will be picked up by effect
  }, []);

  // Effect: Process queue
  React.useEffect(() => {
    if (!currentMessage && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentMessage(next);
      setQueue(rest);
    }
  }, [currentMessage, queue]);

  // Clear all messages
  const clearAll = React.useCallback(() => {
    setQueue([]);
    setCurrentMessage(null);
  }, []);

  return {
    currentMessage,
    queueLength: queue.length,
    addMessage,
    dismissCurrent,
    clearAll
  };
}

export default AutoDismissMessage;




