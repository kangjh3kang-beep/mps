"use client";

import React from "react";
import { Database, Sparkles, Share2 } from "lucide-react";

type InsightIcon = "collect" | "process" | "expand";

interface InsightCardProps {
  title: string;
  description: string;
  icon: InsightIcon;
  value: string;
}

const iconMap: Record<InsightIcon, { icon: React.ElementType; color: string }> = {
  collect: { icon: Database, color: "text-ink" },
  process: { icon: Sparkles, color: "text-dancheong-red" },
  expand: { icon: Share2, color: "text-dancheong-blue" },
};

/**
 * Insight Card
 * 
 * MPS 생태계 인사이트 카드
 */
export function InsightCard({ title, description, icon, value }: InsightCardProps) {
  const { icon: Icon, color } = iconMap[icon];

  return (
    <div className="hanji-card rounded-2xl p-4 lg:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-ink/5 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
        </div>
        <span className="text-responsive-2xl font-light text-foreground">{value}</span>
      </div>

      <h4 className="text-responsive-sm font-medium text-foreground mb-1">{title}</h4>
      <p className="text-responsive-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default InsightCard;


