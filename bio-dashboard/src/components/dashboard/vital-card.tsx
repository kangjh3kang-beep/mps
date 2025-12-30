"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, LucideIcon, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VitalCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  trend?: "up" | "down" | "stable";
  status?: "normal" | "warning" | "critical";
  className?: string;
}

/**
 * Vital Card
 * 
 * 개별 생체 신호 카드 - 가독성 강화 버전
 * - 더 큰 숫자와 명확한 색상 대비
 * - 상태 아이콘으로 직관적 표시
 */
export function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
  trend = "stable",
  status = "normal",
  className
}: VitalCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const statusConfig = {
    normal: {
      bg: "bg-dancheong-green/10",
      border: "border-dancheong-green/20",
      text: "text-dancheong-green",
      icon: CheckCircle2,
      label: "정상"
    },
    warning: {
      bg: "bg-dancheong-yellow/10",
      border: "border-dancheong-yellow/20",
      text: "text-dancheong-yellow",
      icon: AlertTriangle,
      label: "주의"
    },
    critical: {
      bg: "bg-dancheong-red/10",
      border: "border-dancheong-red/20",
      text: "text-dancheong-red",
      icon: XCircle,
      label: "위험"
    }
  };

  const trendConfig = {
    up: { color: "text-dancheong-green", bg: "bg-dancheong-green/10" },
    down: { color: "text-dancheong-red", bg: "bg-dancheong-red/10" },
    stable: { color: "text-ink-light", bg: "bg-ink/5" }
  };

  const config = statusConfig[status];
  const trendStyle = trendConfig[trend];
  const StatusIcon = config.icon;

  return (
    <div className={cn(
      "hanji-card rounded-2xl p-4 lg:p-5 animate-ink-spread transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-0.5",
      status === "critical" && "ring-2 ring-dancheong-red/30",
      className
    )}>
      {/* 상단: 아이콘 + 트렌드 */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center",
          config.bg, config.border, "border"
        )}>
          <Icon className={cn("w-5 h-5 lg:w-6 lg:h-6", config.text)} strokeWidth={1.8} />
        </div>

        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          trendStyle.bg, trendStyle.color
        )}>
          <TrendIcon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 값 - 더 크고 굵게 */}
      <div className="mb-2">
        <span className="text-3xl lg:text-4xl font-bold text-foreground tabular-nums tracking-tight">
          {value}
        </span>
        <span className="text-sm text-muted-foreground ml-1.5 font-medium">{unit}</span>
      </div>

      {/* 라벨 */}
      <p className="text-sm text-muted-foreground font-medium mb-3">{label}</p>

      {/* 상태 표시 - 아이콘으로 직관성 강화 */}
      <div className={cn(
        "flex items-center gap-2 pt-3 border-t border-ink/8"
      )}>
        <StatusIcon className={cn("w-4 h-4", config.text)} />
        <span className={cn("text-xs font-semibold", config.text)}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

export default VitalCard;
