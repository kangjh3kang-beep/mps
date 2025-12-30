"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

// Generate mock data
const generateActivityData = () => {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  return days.map((day) => ({
    name: day,
    걸음수: 5000 + Math.floor(Math.random() * 8000),
    칼로리: 200 + Math.floor(Math.random() * 400),
  }));
};

const generateSleepData = () => {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  return days.map((day) => ({
    name: day,
    수면시간: 5 + Math.random() * 4,
    깊은수면: 1 + Math.random() * 2,
    렘수면: 0.5 + Math.random() * 1.5,
  }));
};

interface AnalyticsChartProps {
  title: string;
  type: "activity" | "sleep";
}

/**
 * Analytics Chart Component
 * 
 * 활동량/수면 분석 차트
 */
export function AnalyticsChart({ title, type }: AnalyticsChartProps) {
  const data = type === "activity" ? generateActivityData() : generateSleepData();

  return (
    <div className="hanji-card rounded-2xl p-4 lg:p-5">
      <h3 className="text-responsive-sm font-medium text-foreground mb-4">{title}</h3>
      
      <div className="h-[200px] lg:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "activity" ? (
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
              />
              <Bar 
                dataKey="걸음수" 
                fill="hsl(var(--ink))" 
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Bar 
                dataKey="칼로리" 
                fill="hsl(var(--dancheong-red))" 
                radius={[4, 4, 0, 0]}
                opacity={0.6}
              />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--dancheong-blue))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--dancheong-blue))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="deepGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--ink))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--ink))" stopOpacity={0} />
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
              />
              <Area
                type="monotone"
                dataKey="수면시간"
                stroke="hsl(var(--dancheong-blue))"
                fill="url(#sleepGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="깊은수면"
                stroke="hsl(var(--ink))"
                fill="url(#deepGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AnalyticsChart;


