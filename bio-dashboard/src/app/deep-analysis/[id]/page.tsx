"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Brain, Cpu, FlaskConical, User, Activity, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { deepAnalysisStore, type DeepAnalysisPacket } from "@/lib/deep-analysis";
import { cn } from "@/lib/utils";
import { useAppToast } from "@/components/system/AppToast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

function safeJson(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function stat(xs: number[]) {
  if (xs.length === 0) return { min: 0, max: 0, mean: 0 };
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  for (const x of xs) {
    min = Math.min(min, x);
    max = Math.max(max, x);
    sum += x;
  }
  return { min, max, mean: sum / xs.length };
}

function toSeriesXY(x: number[], y: number[], xKey: string, yKey: string) {
  const n = Math.min(x.length, y.length);
  const out: Record<string, number>[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ [xKey]: x[i]!, [yKey]: y[i]! });
  }
  return out;
}

export default function DeepAnalysisPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useAppToast();
  const measurementId = params?.id;
  const packetId = measurementId ? `DAP-${measurementId}` : null;

  const [packet, setPacket] = React.useState<DeepAnalysisPacket | null>(null);

  React.useEffect(() => {
    if (!packetId) return;
    setPacket(deepAnalysisStore.get(packetId));
  }, [packetId]);

  if (!measurementId) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-muted-foreground">
        Invalid route.
      </div>
    );
  }

  // Recent 7 navigation (based on persisted measurements list in localStorage)
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("bio-dashboard:v2");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { measurements?: Array<{ id: string; ts: number }> };
      const ms = Array.isArray(parsed?.measurements) ? parsed.measurements : [];
      const ids = ms
        .slice()
        .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
        .slice(0, 7)
        .map((m) => m.id)
        .filter((x): x is string => typeof x === "string" && x.length > 0);
      setRecentIds(ids);
    } catch {
      // ignore
    }
  }, []);

  const navIndex = React.useMemo(() => recentIds.findIndex((x) => x === measurementId), [recentIds, measurementId]);
  const newerId = navIndex > 0 ? recentIds[navIndex - 1] : null;
  const olderId = navIndex >= 0 && navIndex < recentIds.length - 1 ? recentIds[navIndex + 1] : null;

  const goNewer = React.useCallback(() => {
    if (!newerId) {
      toast({ title: "이전(더 최신) 측정 없음", description: "최근 7개 범위의 가장 최신 측정입니다.", variant: "warning" });
      return;
    }
    router.push(`/deep-analysis/${encodeURIComponent(newerId)}`);
  }, [newerId, router, toast]);

  const goOlder = React.useCallback(() => {
    if (!olderId) {
      toast({ title: "다음(더 과거) 측정 없음", description: "최근 7개 범위의 가장 과거 측정입니다.", variant: "warning" });
      return;
    }
    router.push(`/deep-analysis/${encodeURIComponent(olderId)}`);
  }, [olderId, router, toast]);

  // Swipe navigation (mobile)
  const touchRef = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = React.useCallback((e: React.TouchEvent) => {
    const p = e.touches[0];
    if (!p) return;
    touchRef.current = { x: p.clientX, y: p.clientY, t: Date.now() };
  }, []);
  const onTouchEnd = React.useCallback((e: React.TouchEvent) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const p = e.changedTouches[0];
    if (!p) return;
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    const dt = Date.now() - start.t;

    // Basic guard: horizontal swipe only; avoid interfering with vertical scroll
    if (dt > 700) return;
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dy) > 40) return;

    if (dx > 0) {
      // swipe right -> newer (prev)
      goNewer();
    } else {
      // swipe left -> older (next)
      goOlder();
    }
  }, [goNewer, goOlder]);

  if (!packetId || !packet) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Deep Analysis</h1>
          </div>

          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-600" />
                DeepAnalysisPacket not found
              </CardTitle>
              <CardDescription>
                이 측정 ID에 대한 심층 분석 패킷이 저장되어 있지 않습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                요청 measurementId: <span className="font-mono">{measurementId}</span>
              </div>
              <div>
                조회 packetId: <span className="font-mono">{packetId}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                팁: 먼저 측정을 1회 수행한 뒤(서버/로컬), 새로고침 후 다시 접근하세요.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fv = packet.layer1.featureVector88;
  const fvStat = stat(fv);

  const it = packet.layer1.timeSeries.currentVsTime;
  const vi = packet.layer1.timeSeries.voltageVsCurrent;

  const itSeries = React.useMemo(() => toSeriesXY(it.t_s, it.i_uA, "t_s", "i_uA"), [it.t_s, it.i_uA]);
  const viSeries = React.useMemo(() => toSeriesXY(vi.v_V, vi.i_uA, "v_V", "i_uA"), [vi.v_V, vi.i_uA]);

  return (
    <div
      className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="text-lg font-semibold">Deep Analysis</div>
              <div className="text-xs text-muted-foreground font-mono">
                measurementId={packet.measurementId} · packetId={packet.id}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              UTC {packet.createdAtUtc}
            </Badge>
            {recentIds.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("h-7 px-2 text-xs", !newerId && "opacity-50")}
                  title="이전(더 최신) 측정"
                  onClick={goNewer}
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  이전
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("h-7 px-2 text-xs", !olderId && "opacity-50")}
                  title="다음(더 과거) 측정"
                  onClick={goOlder}
                >
                  다음
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
                {navIndex >= 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    최근 7개 중 {navIndex + 1}/{recentIds.length}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Header summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          <Card className="border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                Clinical Result
              </CardTitle>
              <CardDescription className="text-xs">Layer 3 (User)</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-semibold">
                {packet.layer3.concentration.toFixed(1)} {packet.layer3.unit}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                CI: ±{packet.layer3.confidenceIntervalAbs.toFixed(1)} ({packet.layer3.confidenceIntervalPct.toFixed(1)}%)
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-600" />
                Processed Features
              </CardTitle>
              <CardDescription className="text-xs">Layer 2 (Engineer)</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div className="flex justify-between"><span>SNR</span><span className="font-mono">{packet.layer2.signalToNoiseRatio.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Diffusion</span><span className="font-mono">{packet.layer2.diffusionCoefficient.toFixed(4)}</span></div>
              <div className="flex justify-between"><span>Kinetics</span><span className="font-mono">{packet.layer2.reactionKinetics.toFixed(3)}</span></div>
              <div className="flex justify-between"><span>Permeability</span><span className="font-mono">{packet.layer2.membranePermeability.toFixed(3)}</span></div>
            </CardContent>
          </Card>

          <Card className="border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-sky-600" />
                Raw Physics Meta
              </CardTitle>
              <CardDescription className="text-xs">Layer 1 (Scientist)</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div className="flex justify-between"><span>Temp</span><span className="font-mono">{packet.layer1.metadata.tempC.toFixed(1)}°C</span></div>
              <div className="flex justify-between"><span>Humidity</span><span className="font-mono">{packet.layer1.metadata.humidityPct.toFixed(0)}%</span></div>
              <div className="flex justify-between"><span>RAFE Config</span><span className="font-mono">{packet.layer1.metadata.rafeConfigId}</span></div>
              <div className="flex justify-between"><span>FeatureVec</span><span className="font-mono">88‑dim</span></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="user">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scientist" className="text-xs">
              <Activity className="w-3 h-3 mr-1" /> Scientist
            </TabsTrigger>
            <TabsTrigger value="engineer" className="text-xs">
              <Cpu className="w-3 h-3 mr-1" /> Engineer
            </TabsTrigger>
            <TabsTrigger value="user" className="text-xs">
              <User className="w-3 h-3 mr-1" /> User
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Brain className="w-3 h-3 mr-1" /> AI
            </TabsTrigger>
          </TabsList>

          {/* Scientist */}
          <TabsContent value="scientist" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Chronoamperometry: Current vs Time</CardTitle>
                  <CardDescription className="text-xs">High-resolution I‑t (uA vs s)</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={itSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t_s" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="i_uA" stroke="#0ea5e9" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Polarization: Voltage vs Current</CardTitle>
                  <CardDescription className="text-xs">V‑I curve (uA vs V)</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="v_V" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="i_uA" stroke="#16a34a" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border shadow-md lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Feature Vector (88‑dim)</CardTitle>
                  <CardDescription className="text-xs">
                    min={fvStat.min.toFixed(3)} · max={fvStat.max.toFixed(3)} · mean={fvStat.mean.toFixed(3)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[260px] rounded-xl border bg-white">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 text-xs font-mono">
                      {fv.map((v, idx) => (
                        <div
                          key={idx}
                          className={cn("rounded-lg border px-2 py-1 bg-slate-50/40")}
                        >
                          <div className="text-[10px] text-muted-foreground">f[{idx}]</div>
                          <div>{v.toFixed(4)}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engineer */}
          <TabsContent value="engineer" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border shadow-md lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Intermediate Parameters</CardTitle>
                  <CardDescription className="text-xs">Layer 2 extracted features</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <Param label="DiffusionCoefficient" value={packet.layer2.diffusionCoefficient.toFixed(6)} />
                  <Param label="ReactionKinetics" value={packet.layer2.reactionKinetics.toFixed(4)} />
                  <Param label="MembranePermeability" value={packet.layer2.membranePermeability.toFixed(4)} />
                  <Param label="SignalToNoiseRatio" value={`${packet.layer2.signalToNoiseRatio.toFixed(2)} dB`} />
                </CardContent>
              </Card>

              <Card className="border shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Calibration</CardTitle>
                  <CardDescription className="text-xs">Coefficients used</CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  {packet.layer1.metadata.calibrationCoefficientsUsed ? (
                    <pre className="text-[11px] rounded-lg border bg-white p-3 overflow-auto max-h-[260px]">
                      {safeJson(packet.layer1.metadata.calibrationCoefficientsUsed)}
                    </pre>
                  ) : (
                    <div className="text-muted-foreground">No calibration metadata.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User */}
          <TabsContent value="user" className="mt-4">
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">결과 요약</CardTitle>
                <CardDescription className="text-xs">Layer 3 (Clinical Result)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-sky-700">
                  {packet.layer3.concentration.toFixed(1)} {packet.layer3.unit}
                </div>
                <div className="text-sm text-muted-foreground">
                  신뢰구간: ±{packet.layer3.confidenceIntervalAbs.toFixed(1)} ({packet.layer3.confidenceIntervalPct.toFixed(1)}%)
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  * 본 화면은 사용자 레벨 요약이며, 상세 원시 신호/특징/AI trace는 다른 탭에서 확인할 수 있습니다.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI */}
          <TabsContent value="ai" className="mt-4">
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Interpretation Trace</CardTitle>
                <CardDescription className="text-xs">Layer 4 (ai_interpretation_log)</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-[11px] rounded-xl border bg-white p-3 overflow-auto max-h-[520px]">
                  {safeJson(packet.layer4.ai_interpretation_log)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile bottom navigation bar */}
      {recentIds.length > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              className={cn("h-9 flex-1", !newerId && "opacity-60")}
              onClick={goNewer}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              이전
            </Button>

            <div className="text-[11px] text-muted-foreground text-center min-w-[96px]">
              {navIndex >= 0 ? (
                <div>
                  최근 7개
                  <div className="font-mono text-foreground">
                    {navIndex + 1}/{recentIds.length}
                  </div>
                </div>
              ) : (
                <div>최근 7개</div>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              className={cn("h-9 flex-1", !olderId && "opacity-60")}
              onClick={goOlder}
            >
              다음
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      )}
    </div>
  );
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm mt-1">{value}</div>
    </div>
  );
}
