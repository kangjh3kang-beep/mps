"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface HongikScoreProps {
  score?: number;
  trend?: "up" | "down" | "stable";
  label?: string;
}

/**
 * Hongik Score (홍익 점수)
 * 
 * 종합 건강 점수를 수묵화 스타일로 시각화
 * 가독성 강화: 더 큰 숫자, 명확한 색상 대비
 */
export function HongikScore({
  score = 87,
  trend = "up",
  label = "종합 건강 점수"
}: HongikScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // 점수 카운터 애니메이션
  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-dancheong-green";
    if (s >= 60) return "text-dancheong-yellow";
    if (s >= 40) return "text-dancheong-red/80";
    return "text-dancheong-red";
  };

  const getScoreGradient = (s: number) => {
    if (s >= 80) return { start: "#22c55e", end: "#16a34a" };
    if (s >= 60) return { start: "#eab308", end: "#ca8a04" };
    if (s >= 40) return { start: "#f97316", end: "#ea580c" };
    return { start: "#ef4444", end: "#dc2626" };
  };

  const getStatusEmoji = (s: number) => {
    if (s >= 80) return "🌟";
    if (s >= 60) return "👍";
    if (s >= 40) return "⚠️";
    return "🔴";
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-dancheong-green" : trend === "down" ? "text-dancheong-red" : "text-ink-wash";
  const trendBg = trend === "up" ? "bg-dancheong-green/10" : trend === "down" ? "bg-dancheong-red/10" : "bg-ink/5";

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference * (1 - score / 100);
  const gradientColors = getScoreGradient(score);

  return (
    <div className="hanji-card rounded-2xl p-4 lg:p-5 h-full animate-ink-spread" style={{ animationDelay: "0.1s" }}>
      <div className="flex flex-col h-full">
        {/* 헤더: 라벨 + 트렌드 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-dancheong-yellow" />
            <h3 className="text-responsive-sm font-semibold text-foreground">
              {label}
            </h3>
          </div>
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full text-responsive-xs font-medium", trendBg, trendColor)}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{trend === "up" ? "+3%" : trend === "down" ? "-2%" : "0%"}</span>
          </div>
        </div>

        {/* 원형 점수 게이지 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-32 h-32 lg:w-36 lg:h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={gradientColors.start} />
                  <stop offset="100%" stopColor={gradientColors.end} />
                </linearGradient>
              </defs>
              {/* 배경 원 */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-ink/8"
              />
              {/* 진행 원 */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: "stroke-dashoffset 1.2s ease-out"
                }}
              />
            </svg>

            {/* 점수 텍스트 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-4xl lg:text-5xl font-bold tabular-nums tracking-tight", getScoreColor(score))}>
                {animatedScore}
              </span>
              <span className="text-sm text-muted-foreground font-medium mt-0.5">점</span>
            </div>

            {/* 외곽 글로우 효과 */}
            {score >= 80 && (
              <div className="absolute inset-0 rounded-full animate-pulse-soft" 
                   style={{ boxShadow: `0 0 30px ${gradientColors.start}30` }} />
            )}
          </div>
        </div>

        {/* 상태 라벨 */}
        <div className="text-center pt-4 border-t border-ink/6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">{getStatusEmoji(score)}</span>
            <span className={cn("text-responsive-sm font-medium", getScoreColor(score))}>
              {score >= 80 ? "매우 좋음" : score >= 60 ? "양호" : score >= 40 ? "주의 필요" : "개선 필요"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HongikScore;
