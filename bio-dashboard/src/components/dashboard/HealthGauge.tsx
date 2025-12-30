"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function strokeForScore(score: number) {
  if (score > 80) return "#16a34a"; // green
  if (score >= 50) return "#eab308"; // yellow
  return "#e11d48"; // red
}

export function HealthGauge({
  score,
  className
}: {
  score: number;
  className?: string;
}) {
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const pct = clamped / 100;
  const dash = c * pct;
  const gap = c - dash;
  const color = strokeForScore(clamped);

  return (
    <div className={cn("flex items-center justify-center", className)}>
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
          <div className="text-4xl font-semibold tracking-tight">{clamped}</div>
          <div className="mt-1 text-xs text-muted-foreground">Health Score</div>
        </div>
      </div>
    </div>
  );
}







