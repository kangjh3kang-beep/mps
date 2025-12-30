"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { Measurement } from "@/lib/bio";

function fmtDay(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function TrendChart({ data }: { data: Measurement[] }) {
  const chartData = React.useMemo(
    () =>
      data
        .slice()
        .sort((a, b) => a.ts - b.ts)
        .map((m) => ({
          ts: m.ts,
          day: fmtDay(m.ts),
          concentration: m.concentrationMmolL
        })),
    [data]
  );

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            domain={[0.5, 3.0]}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))"
            }}
            labelFormatter={(label) => `날짜: ${label}`}
            formatter={(value: number) => [`${value.toFixed(2)} mmol/L`, "농도"]}
          />
          <Line
            type="monotone"
            dataKey="concentration"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}







