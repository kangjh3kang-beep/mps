"use client";

import React from "react";
import {
  ShieldAlert,
  Wind,
  Droplets,
  Activity,
  List as ListIcon,
  Zap,
  RotateCcw
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEHDDriver, useEHD, type EHDEvent } from "@/lib/ehd-driver";

type TrendPoint = { ts: number; voltageKV: number; flow: number; humidity: number };

export function EHDAirIntakePanel({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  const ehd = useEHD();
  const driver = React.useMemo(() => getEHDDriver(), []);
  const [events, setEvents] = React.useState<EHDEvent[]>(() => driver.getEventLog().slice(-50));
  const [trend, setTrend] = React.useState<TrendPoint[]>([]);

  React.useEffect(() => {
    return driver.subscribeEvents((e) => {
      setEvents((prev) => [...prev, e].slice(-50));
    });
  }, [driver]);

  // Build a time series window for charts
  React.useEffect(() => {
    const id = window.setInterval(() => {
      setTrend((prev) => {
        const next: TrendPoint = {
          ts: Date.now(),
          voltageKV: ehd.voltageKV,
          flow: ehd.state.currentFlowRate,
          humidity: ehd.state.humidityPct
        };
        const merged = [...prev, next];
        return merged.length > 180 ? merged.slice(-180) : merged;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [ehd.voltageKV, ehd.state.currentFlowRate, ehd.state.humidityPct]);

  const isFaulted = ehd.state.fault !== "NONE";
  const isShutdown = isFaulted || !ehd.state.enabled;

  const statusBadge = isShutdown ? (
    <Badge className="bg-rose-100 text-rose-700 border border-rose-200">
      <ShieldAlert className="w-3 h-3 mr-1" />
      SHUTDOWN
    </Badge>
  ) : (
    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
      <Wind className="w-3 h-3 mr-1" />
      ACTIVE
    </Badge>
  );

  if (compact) {
    return (
      <Card className={cn("border", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-cyan-600" />
              <div>
                <div className="text-sm font-semibold">EHD Air Intake</div>
                <div className="text-xs text-muted-foreground">
                  {ehd.voltageKV.toFixed(2)}kV · Flow {ehd.state.currentFlowRate.toFixed(1)}
                </div>
              </div>
            </div>
            {statusBadge}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wind className="w-5 h-5 text-cyan-600" />
              EHD Active Air Suction
            </CardTitle>
            <CardDescription>High Voltage PID + Ozone/Arcing protection</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge}
            {isFaulted && (
              <Button size="sm" variant="outline" onClick={ehd.resetFault}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Live stats */}
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Voltage" value={`${ehd.voltageKV.toFixed(2)} kV`} icon={<Zap className="w-4 h-4 text-amber-500" />} />
          <Stat label="Flow" value={`${ehd.state.currentFlowRate.toFixed(2)}`} icon={<Activity className="w-4 h-4 text-blue-500" />} />
          <Stat
            label="Humidity"
            value={`${ehd.state.humidityPct.toFixed(0)}%`}
            icon={<Droplets className={cn("w-4 h-4", ehd.state.humidityPct > 90 ? "text-rose-500" : "text-sky-500")} />}
          />
          <Stat label="Level" value={ehd.state.suctionLevel.toUpperCase()} icon={<Wind className="w-4 h-4 text-cyan-500" />} />
        </div>

        {/* Trend chart */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="ts"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => new Date(v).toLocaleTimeString()}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} domain={[0, 3.6]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 8]} />
              <Tooltip
                labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()}
                formatter={(val: any, name) => {
                  if (name === "voltageKV") return [`${Number(val).toFixed(2)} kV`, "Voltage"];
                  if (name === "flow") return [Number(val).toFixed(2), "Flow"];
                  if (name === "humidity") return [`${Number(val).toFixed(0)}%`, "Humidity"];
                  return [val, name];
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="voltageKV" stroke="#06b6d4" dot={false} strokeWidth={2} name="Voltage (kV)" />
              <Line yAxisId="right" type="monotone" dataKey="flow" stroke="#3b82f6" dot={false} strokeWidth={2} name="Flow" />
              <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#f43f5e" dot={false} strokeWidth={1} strokeDasharray="4 3" name="Humidity (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Safety + event log */}
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ListIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Safety / Events</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                driver.clearEventLog();
                setEvents([]);
              }}
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1 max-h-40 overflow-auto pr-1">
            {events.length === 0 ? (
              <div className="text-xs text-muted-foreground">No events yet.</div>
            ) : (
              events
                .slice()
                .reverse()
                .map((e) => (
                  <div key={`${e.ts}-${e.type}-${e.message}`} className="text-xs flex items-start gap-2">
                    <span className="font-mono text-muted-foreground shrink-0">
                      {new Date(e.ts).toLocaleTimeString()}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] border",
                        e.type === "SAFETY_SHUTDOWN"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : e.type === "AUTO_LEVEL_APPLIED"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      {e.type}
                    </span>
                    <span className="text-muted-foreground">{e.message}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        {icon}
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export default EHDAirIntakePanel;







