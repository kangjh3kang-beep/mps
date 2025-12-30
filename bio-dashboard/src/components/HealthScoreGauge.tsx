"use client";

import * as React from "react";

import { scoreStroke } from "@/lib/bio";
import { cn } from "@/lib/utils";

export function HealthScoreGauge({
  score,
  label = "Health Score",
  className
}: {
  score: number;
  label?: string;
  className?: string;
}) {
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = c * pct;
  const gap = c - dash;
  const color = scoreStroke(score);

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative">
        <svg width={size} height={size} className="drop-shadow-sm">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-semibold tracking-tight">{score}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}







