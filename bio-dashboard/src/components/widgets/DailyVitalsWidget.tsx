"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Heart, TrendingUp, TrendingDown, Minus, Droplets } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface DailyVitalsWidgetProps {
  healthScore: number;
  concentration: number;
  trend: "up" | "down" | "stable";
  lastUpdated?: number;
  latestMeasurementId?: string;
  className?: string;
}

/**
 * Daily Vitals Widget - Manpasik Nebula Edition
 * 
 * Large circular gauge with animated health score
 */
export function DailyVitalsWidget({
  healthScore,
  concentration,
  trend,
  lastUpdated,
  latestMeasurementId,
  className
}: DailyVitalsWidgetProps) {
  const { t } = useI18n();
  // Client-side heart rate (to avoid hydration mismatch)
  const [heartRate, setHeartRate] = useState(72);
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    setHeartRate(72 + Math.floor(Math.random() * 10));
    
    // Animate score counter
    const duration = 1000;
    const steps = 60;
    const increment = healthScore / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= healthScore) {
        setAnimatedScore(healthScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [healthScore]);

  // Score-based styling
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-sky-500";
    if (score >= 40) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-emerald-400 to-teal-500";
    if (score >= 60) return "from-sky-400 to-blue-500";
    if (score >= 40) return "from-amber-400 to-orange-500";
    return "from-rose-400 to-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t("health.excellent");
    if (score >= 60) return t("health.good");
    if (score >= 40) return t("health.fair");
    return t("health.attention");
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-rose-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (ts: number) => {
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000) return "방금 전";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return new Date(ts).toLocaleDateString("ko-KR");
  };

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference * (1 - healthScore / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        glass 
        elevated
        className={cn("overflow-hidden", className)}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 flex items-center justify-center shadow-nebula-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Activity className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-base">{t("vitals.title")}</h3>
                <p className="text-xs text-muted-foreground">{t("vitals.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <Badge variant="secondary" className="text-xs bg-white/60 dark:bg-slate-800/60">
                  {formatTime(lastUpdated)}
                </Badge>
              )}
              {latestMeasurementId && (
                <Button
                  asChild
                  size="sm"
                  variant="glass"
                  className="h-8 px-3 text-xs"
                >
                  <Link href={`/deep-analysis/${encodeURIComponent(latestMeasurementId)}`} prefetch={false}>
                    {t("vitals.deepAnalysis")}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Main Score Display - Large Circular Gauge */}
          <div className="relative mb-5">
            <motion.div 
              className="relative w-44 h-44 mx-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Outer glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-full blur-xl opacity-30",
                `bg-gradient-to-br ${getScoreGradient(healthScore)}`
              )} />
              
              <svg className="w-full h-full transform -rotate-90 relative z-10">
                {/* Background Circle */}
                <circle
                  cx="88"
                  cy="88"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-slate-200 dark:text-slate-700"
                />
                {/* Progress Circle with gradient */}
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={healthScore >= 60 ? "#0ea5e9" : "#f43f5e"} />
                    <stop offset="100%" stopColor={healthScore >= 60 ? "#2563eb" : "#e11d48"} />
                  </linearGradient>
                </defs>
                <motion.circle
                  cx="88"
                  cy="88"
                  r="70"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="drop-shadow-lg"
                />
              </svg>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <motion.div 
                  className={cn("text-5xl font-bold tabular-nums", getScoreColor(healthScore))}
                  key={animatedScore}
                >
                  {animatedScore}
                </motion.div>
                <div className="text-sm text-muted-foreground font-medium mt-1">
                  {getScoreLabel(healthScore)}
                </div>
              </div>
            </motion.div>

            {/* Animated pulse for low score */}
            {healthScore < 50 && (
              <motion.div 
                className="absolute inset-0 rounded-full bg-rose-500/10"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Lactate Level */}
            <motion.div 
              className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 backdrop-blur-sm border border-slate-100 dark:border-slate-700"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-sky-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">젖산 농도</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold">{concentration.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground mb-1">mmol/L</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon()}
                <span className="text-xs text-muted-foreground">7일 추세</span>
              </div>
            </motion.div>

            {/* Heart Rate (Mock) */}
            <motion.div 
              className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 backdrop-blur-sm border border-slate-100 dark:border-slate-700"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">심박수</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold">{heartRate}</span>
                <span className="text-xs text-muted-foreground mb-1">BPM</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Minus className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">정상 범위</span>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default DailyVitalsWidget;
