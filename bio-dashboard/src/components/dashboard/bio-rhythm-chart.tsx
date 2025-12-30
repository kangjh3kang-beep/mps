"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

// Mock data for the last 7 days
const generateBioRhythmData = () => {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  return days.map((day, index) => ({
    name: day,
    심박수: 68 + Math.floor(Math.random() * 10),
    수면: 6 + Math.random() * 2.5,
    활동량: 5000 + Math.floor(Math.random() * 5000),
    스트레스: 30 + Math.floor(Math.random() * 30),
  }));
};

const data = generateBioRhythmData();

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="hanji-card rounded-lg p-3 shadow-lg">
        <p className="text-responsive-xs font-medium text-foreground mb-2">{label}요일</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-responsive-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="text-foreground font-medium">
                {entry.name === "수면"
                  ? `${entry.value.toFixed(1)}시간`
                  : entry.name === "활동량"
                  ? `${entry.value.toLocaleString()}걸음`
                  : entry.name === "심박수"
                  ? `${entry.value}bpm`
                  : `${entry.value}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Bio Rhythm Chart
 * 
 * 주간 바이오리듬 차트 - 수묵화 스타일 그라데이션
 */
export function BioRhythmChart() {
  return (
    <div className="hanji-card rounded-2xl p-4 lg:p-5 h-full animate-ink-spread" style={{ animationDelay: "0.15s" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-responsive-sm font-medium text-foreground">주간 바이오리듬</h3>
          <p className="text-responsive-xs text-muted-foreground">심박수 · 수면 · 활동량</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-ink" />
            <span className="text-responsive-xs text-muted-foreground">심박수</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-dancheong-blue" />
            <span className="text-responsive-xs text-muted-foreground">수면</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-dancheong-green" />
            <span className="text-responsive-xs text-muted-foreground">활동량</span>
          </div>
        </div>
      </div>

      <div className="h-[180px] lg:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="inkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--ink))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--ink))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--dancheong-blue))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--dancheong-blue))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--dancheong-green))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--dancheong-green))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-ink/10" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="심박수"
              stroke="hsl(var(--ink))"
              strokeWidth={2}
              fill="url(#inkGradient)"
            />
            <Area
              type="monotone"
              dataKey="수면"
              stroke="hsl(var(--dancheong-blue))"
              strokeWidth={2}
              fill="url(#blueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default BioRhythmChart;
