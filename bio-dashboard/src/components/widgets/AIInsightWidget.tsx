"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, MessageCircle, ChevronRight, AlertTriangle, Sun, Moon, Cloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface AIInsightWidgetProps {
  insight: string;
  healthScore: number;
  onChatOpen?: () => void;
  className?: string;
}

/**
 * AI Insight Widget - Manpasik Nebula Edition
 * 
 * Chat-bubble style card showing AI health summary
 */
export function AIInsightWidget({
  insight,
  healthScore,
  onChatOpen,
  className
}: AIInsightWidgetProps) {
  const { t } = useI18n();
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: "새벽이에요", icon: <Moon className="w-4 h-4" /> };
    if (hour < 12) return { text: "좋은 아침이에요", icon: <Sun className="w-4 h-4" /> };
    if (hour < 18) return { text: "좋은 오후에요", icon: <Cloud className="w-4 h-4" /> };
    return { text: "좋은 저녁이에요", icon: <Moon className="w-4 h-4" /> };
  };

  const greeting = getGreeting();

  // Determine urgency level with Nebula colors
  const getUrgencyStyle = () => {
    if (healthScore < 50) {
      return {
        gradient: "from-rose-50 via-orange-50/50 to-rose-50/30 dark:from-rose-950/30 dark:via-orange-950/20 dark:to-rose-950/10",
        border: "border-rose-200/50 dark:border-rose-800/30",
        badge: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
        icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
        glow: "shadow-nebula-rose-glow"
      };
    }
    if (healthScore < 70) {
      return {
        gradient: "from-amber-50 via-yellow-50/50 to-amber-50/30 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-amber-950/10",
        border: "border-amber-200/50 dark:border-amber-800/30",
        badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
        icon: <Sparkles className="w-4 h-4 text-amber-500" />,
        glow: ""
      };
    }
    return {
      gradient: "from-sky-50 via-cyan-50/50 to-sky-50/30 dark:from-sky-950/30 dark:via-cyan-950/20 dark:to-sky-950/10",
      border: "border-sky-200/50 dark:border-sky-800/30",
      badge: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
      icon: <Sparkles className="w-4 h-4 text-sky-500" />,
      glow: ""
    };
  };

  const style = getUrgencyStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card 
        className={cn(
          "overflow-hidden",
          `bg-gradient-to-br ${style.gradient}`,
          style.border,
          style.glow,
          "backdrop-blur-sm",
          className
        )}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-nebula-sm"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bot className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base">{t("coach.title")}</h3>
                  <Badge className={cn("text-[10px] px-2 py-0.5 gap-1", style.badge)}>
                    {style.icon}
                    <span>{t("coach.active")}</span>
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  {greeting.icon}
                  <span>{greeting.text}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insight Message - Chat bubble style */}
          <motion.div 
            className="relative bg-white/90 dark:bg-slate-800/90 rounded-2xl rounded-bl-md p-4 mb-4 shadow-nebula-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {/* Chat tail */}
            <div className="absolute -left-2 bottom-4 w-4 h-4 bg-white/90 dark:bg-slate-800/90 rotate-45" />
            
            <p className="text-sm leading-relaxed text-foreground/90 relative z-10">
              {insight || "오늘의 건강 데이터를 분석 중입니다..."}
            </p>
          </motion.div>

          {/* Quick Tips */}
          {healthScore < 70 && (
            <motion.div 
              className="flex flex-wrap gap-2 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Badge variant="outline" className="text-xs bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700">
                💧 수분 섭취
              </Badge>
              <Badge variant="outline" className="text-xs bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700">
                🚶 가벼운 산책
              </Badge>
              <Badge variant="outline" className="text-xs bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700">
                😴 충분한 휴식
              </Badge>
            </motion.div>
          )}

          {/* Chat Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="glass"
              className="w-full justify-between h-12 rounded-xl"
              onClick={onChatOpen}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">AI 코치에게 질문하기</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AIInsightWidget;
