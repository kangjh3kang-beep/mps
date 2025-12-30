"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { motion } from "framer-motion";

export type TrendPoint = {
  ts: number;
  concentration: number;
};

function fmtDay(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * Manpasik Nebula - Custom Dark Glass Tooltip
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const value = payload[0]?.value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="chart-tooltip-dark"
    >
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-white">
          {typeof value === "number" ? value.toFixed(2) : value}
        </span>
        <span className="text-xs text-slate-400">mmol/L</span>
      </div>
    </motion.div>
  );
}

/**
 * Manpasik Nebula TrendChart
 * Features: Gradient fills, smooth curves, dark glass tooltips
 */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  const chartData = React.useMemo(
    () =>
      data
        .slice()
        .sort((a, b) => a.ts - b.ts)
        .map((p) => ({
          day: fmtDay(p.ts),
          concentration: p.concentration
        })),
    [data]
  );

  // Generate unique gradient ID
  const gradientId = React.useId();

  return (
    <motion.div 
      className="h-56 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData} 
          margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id={`gradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`line-gradient-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
            vertical={false}
          />
          
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="hsl(var(--muted-foreground))"
            tickMargin={8}
            dy={4}
          />
          
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            domain={[0.5, 3.0]}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v) => `${v.toFixed(1)}`}
            width={40}
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{
              stroke: "hsl(var(--primary))",
              strokeWidth: 1,
              strokeDasharray: "4 4",
              strokeOpacity: 0.5,
            }}
          />
          
          <Area
            type="monotone"
            dataKey="concentration"
            stroke={`url(#line-gradient-${gradientId})`}
            strokeWidth={3}
            fill={`url(#gradient-${gradientId})`}
            dot={{
              r: 4,
              fill: "#fff",
              stroke: "#0ea5e9",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: "#0ea5e9",
              stroke: "#fff",
              strokeWidth: 2,
              className: "drop-shadow-lg",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/**
 * Mini Trend Sparkline (for compact displays)
 */
export function TrendSparkline({ 
  data, 
  color = "#0ea5e9",
  height = 40 
}: { 
  data: number[]; 
  color?: string;
  height?: number;
}) {
  const chartData = data.map((value, index) => ({ index, value }));
  const sparklineId = React.useId();

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${sparklineId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${sparklineId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
