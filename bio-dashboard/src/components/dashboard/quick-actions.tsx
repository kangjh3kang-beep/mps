"use client";

import React from "react";
import { Plus, Calendar, Pill, Phone, Zap, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const actions: ActionItem[] = [
  { 
    icon: Plus, 
    label: "측정 기록", 
    description: "새 데이터 추가",
    color: "text-dancheong-red",
    bgColor: "bg-dancheong-red/10",
    borderColor: "border-dancheong-red/20"
  },
  { 
    icon: Calendar, 
    label: "예약", 
    description: "진료 일정",
    color: "text-dancheong-blue",
    bgColor: "bg-dancheong-blue/10",
    borderColor: "border-dancheong-blue/20"
  },
  { 
    icon: Pill, 
    label: "약 알림", 
    description: "복용 관리",
    color: "text-dancheong-green",
    bgColor: "bg-dancheong-green/10",
    borderColor: "border-dancheong-green/20"
  },
  { 
    icon: Phone, 
    label: "상담", 
    description: "전문가 연결",
    color: "text-dancheong-yellow",
    bgColor: "bg-dancheong-yellow/10",
    borderColor: "border-dancheong-yellow/20"
  },
];

/**
 * Quick Actions
 * 
 * 빠른 실행 버튼 그리드 - 가독성 강화 버전
 */
export function QuickActions() {
  return (
    <div className="hanji-card rounded-2xl p-5 lg:p-6 h-full animate-ink-spread" style={{ animationDelay: "0.3s" }}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-dancheong-yellow" />
        <h3 className="text-base font-bold text-foreground">빠른 실행</h3>
      </div>

      {/* 액션 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className={cn(
              "flex flex-col items-center gap-2.5 p-4 rounded-xl",
              "border transition-all duration-200",
              action.bgColor, action.borderColor,
              "hover:shadow-md hover:-translate-y-0.5",
              "group"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-white/80 shadow-sm",
              "group-hover:scale-110 transition-transform"
            )}>
              <action.icon className={cn("w-6 h-6", action.color)} strokeWidth={1.8} />
            </div>
            <div className="text-center">
              <span className="block text-sm font-semibold text-foreground">{action.label}</span>
              <span className="block text-[10px] text-muted-foreground mt-0.5">{action.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
