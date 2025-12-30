"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  FlaskConical,
  LineChart as LineChartIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from "recharts";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { DeepAnalysisPacket } from "@/lib/deep-analysis";
import { ReportSmartCard } from "@/components/dashboard/ReportSmartCard";
import { generateSimulatedReport, type UserProfile, type GeneratedReport, type ReportContext } from "@/lib/reporting";
import { useAppToast } from "@/components/system/AppToast";

type Mode = "simple" | "pro";

type Props = {
  healthScore: number;
  concentrationMmolL: number;
  uncertaintyAbs?: number; // ±
  deepPacket?: DeepAnalysisPacket | null;
  userProfile?: UserProfile;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, unknown>>) {
  const keys = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>())
  );
  const esc = (v: unknown) => {
    const str = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
    return str;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

function makeNyquistFromFeatures(packet: DeepAnalysisPacket) {
  // Synthetic EIS Nyquist based on extracted features, good enough for "Pro View" demo.
  const snr = packet.layer2.signalToNoiseRatio;
  const permeability = packet.layer2.membranePermeability;
  const kinetics = packet.layer2.reactionKinetics;

  const Rs = clamp(12 + (1 - permeability) * 40, 5, 80);
  const Rct = clamp(35 + (1.5 - clamp(kinetics, 0, 1.5)) * 70, 20, 180);
  const alpha = clamp(0.75 + (snr - 20) / 100, 0.6, 0.95);

  const N = 60;
  const pts: Array<{ zRe: number; zImNeg: number; featureIndex: number }> = [];
  for (let i = 0; i < N; i++) {
    const th = (i / (N - 1)) * Math.PI;
    // depressed semicircle
    const x = Rs + (Rct / 2) * (1 + Math.cos(th));
    const y = -(Rct / 2) * Math.sin(th) * alpha;
    const featureIndex = i % 88;
    pts.push({
      zRe: Number(x.toFixed(3)),
      zImNeg: Number(y.toFixed(3)),
      featureIndex
    });
  }
  return pts;
}

function buildAnalogy(packet?: DeepAnalysisPacket | null) {
  // Minimal "Analogy Engine": translate technical intermediates into meaning + action.
  if (!packet) {
    return {
      headline: "데이터가 충분히 없어요",
      meaning: "상세 분석 패킷이 없어 기본 결과만 표시합니다.",
      action: "측정을 한 번 더 진행해 주세요."
    };
  }

  const { diffusionCoefficient, membranePermeability, reactionKinetics, signalToNoiseRatio } = packet.layer2;

  // Priority rules (simple heuristic)
  if (signalToNoiseRatio < 18) {
    return {
      headline: "신호가 탁해요",
      meaning: "센서 노이즈가 많아서(데이터 순도↓) 결과 신뢰도가 떨어질 수 있어요.",
      action: "측정 중 손을 고정하고, 접촉 압력을 일정하게 유지하세요."
    };
  }
  if (diffusionCoefficient < 0.00003) {
    return {
      headline: "흐름이 조금 느려요",
      meaning: "확산계수가 낮아 ‘혈액 점도가 약간 높은 것처럼’ 물질 이동이 느린 패턴이에요.",
      action: "물 한 컵을 천천히 마시고 10분 후 재측정해 보세요."
    };
  }
  if (membranePermeability < 0.65) {
    return {
      headline: "필터 통과가 둔해요",
      meaning: "막 투과도가 낮아 ‘필터가 살짝 막힌 것처럼’ 반응이 둔하게 나타날 수 있어요.",
      action: "카트리지 상태를 확인하고, 필요 시 새 카트리지로 교체하세요."
    };
  }
  if (reactionKinetics < 0.15) {
    return {
      headline: "반응이 느린 편이에요",
      meaning: "전자 전달(반응 속도)이 낮아 결과가 천천히 형성되는 패턴이에요.",
      action: "측정 시간을 충분히 확보하고, 같은 조건으로 1회 더 측정하세요."
    };
  }

  return {
    headline: "대체로 안정적이에요",
    meaning: "중간 파라미터들이 정상 범위에 가까워 데이터 품질이 양호해요.",
    action: "평소처럼 유지하되, 운동 후에는 휴식 후 측정하세요."
  };
}

function trafficLightStatus(score: number) {
  if (score >= 80) return { label: "Green", color: "bg-emerald-500", idx: 0 };
  if (score >= 60) return { label: "Yellow", color: "bg-amber-500", idx: 1 };
  return { label: "Red", color: "bg-rose-500", idx: 2 };
}

function featureLabel(featureIndex: number) {
  // Lightweight mapping. Keep deterministic, but meaningful.
  if (featureIndex === 42) return "Feature #42: Oxidation Peak Height";
  if (featureIndex === 17) return "Feature #17: Signal-to-Noise Proxy";
  if (featureIndex === 11) return "Feature #11: Differential Mean";
  return `Feature #${featureIndex}`;
}

function normalizeContext(next: ReportContext): ReportContext {
  // Ensure exactly one of the "state" flags is true (default: resting).
  const flags: Array<keyof ReportContext> = ["resting", "fasting", "postprandial", "postExercise"];
  const anyTrue = flags.some((k) => (next as any)[k] === true);
  if (!anyTrue) return { ...next, resting: true };
  // If multiple are true, keep the first one in the list order that is true.
  const first = flags.find((k) => (next as any)[k] === true) ?? "resting";
  const cleaned: ReportContext = { ...next };
  flags.forEach((k) => {
    (cleaned as any)[k] = k === first;
  });
  return cleaned;
}

function contextLabel(ctx: ReportContext) {
  if (ctx.fasting) return "공복";
  if (ctx.postprandial) return "식후";
  if (ctx.postExercise) return "운동 직후";
  return "안정(휴식)";
}

function ReportContextControls({
  value,
  onChange
}: {
  value: ReportContext;
  onChange: (next: ReportContext) => void;
}) {
  const [medText, setMedText] = React.useState("");

  const setMode = (k: "resting" | "fasting" | "postprandial" | "postExercise") => {
    onChange(normalizeContext({ ...value, resting: false, fasting: false, postprandial: false, postExercise: false, [k]: true }));
  };

  const meds = new Set((value.medications ?? []).map((m) => m.toLowerCase()));
  const toggleMed = (med: string) => {
    const next = new Set(meds);
    const key = med.trim().toLowerCase();
    if (!key) return;
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange({ ...value, medications: Array.from(next.values()) });
  };

  const removeMed = (med: string) => {
    const next = new Set(meds);
    next.delete(med.toLowerCase());
    onChange({ ...value, medications: Array.from(next.values()) });
  };

  const addFromInput = () => {
    const key = medText.trim().toLowerCase();
    if (!key) return;
    const next = new Set(meds);
    next.add(key);
    onChange({ ...value, medications: Array.from(next.values()) });
    setMedText("");
  };

  const quick = ["metformin", "insulin", "statin"];

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-900">상황(Context)</div>
        <Badge variant="secondary" className="text-[10px]">
          {contextLabel(value)}
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={value.resting ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => setMode("resting")}
        >
          안정(휴식)
        </Button>
        <Button
          size="sm"
          variant={value.fasting ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => setMode("fasting")}
        >
          공복
        </Button>
        <Button
          size="sm"
          variant={value.postprandial ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => setMode("postprandial")}
        >
          식후
        </Button>
        <Button
          size="sm"
          variant={value.postExercise ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => setMode("postExercise")}
        >
          운동 직후
        </Button>
      </div>

      <div className="mt-3">
        <div className="text-[11px] text-muted-foreground">약물:</div>

        {/* Quick picks */}
        <div className="mt-1 flex flex-wrap gap-2">
          {quick.map((m) => (
            <Button
              key={m}
              size="sm"
              variant={meds.has(m) ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => toggleMed(m)}
            >
              {m}
            </Button>
          ))}
        </div>

        {/* Add custom */}
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={medText}
            onChange={(e) => setMedText(e.target.value)}
            placeholder="예: metformin, insulin, statin..."
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFromInput();
              }
            }}
          />
          <Button size="sm" className="h-8 text-xs" onClick={addFromInput} disabled={medText.trim().length === 0}>
            추가
          </Button>
        </div>

        {/* Selected meds */}
        {(value.medications?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(value.medications ?? []).map((m) => (
              <button
                key={m}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-100"
                onClick={() => removeMed(m)}
                title="클릭하여 제거"
              >
                <span className="font-mono">{m}</span>
                <span className="text-slate-400">×</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CVTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as { v_V: number; i_uA: number; featureIndex: number };
  if (!d) return null;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold flex items-center gap-2">
        <LineChartIcon className="w-3.5 h-3.5 text-sky-600" />
        CV Curve
      </div>
      <div className="mt-1 font-mono">
        V={d.v_V.toFixed(3)} V · I={d.i_uA.toFixed(3)} μA
      </div>
      <div className="mt-1 text-muted-foreground">{featureLabel(d.featureIndex)}</div>
    </div>
  );
}

function EISTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as { zRe: number; zImNeg: number; featureIndex: number };
  if (!d) return null;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold flex items-center gap-2">
        <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
        EIS Nyquist
      </div>
      <div className="mt-1 font-mono">
        Z′={d.zRe.toFixed(3)} Ω · −Z″={d.zImNeg.toFixed(3)} Ω
      </div>
      <div className="mt-1 text-muted-foreground">{featureLabel(d.featureIndex)}</div>
    </div>
  );
}

export function ResultPage({ healthScore, concentrationMmolL, uncertaintyAbs, deepPacket, userProfile: userProfileProp, className }: Props) {
  const [mode, setMode] = React.useState<Mode>("simple");
  const [focusedFeature, setFocusedFeature] = React.useState<number | null>(null);
  const proRef = React.useRef<HTMLDivElement | null>(null);
  const { toast } = useAppToast();

  const userProfile: UserProfile = React.useMemo(
    () =>
      userProfileProp ?? {
        age: 45,
        gender: "male",
        conditions: ["(demo)"]
      },
    [userProfileProp]
  );

  const tl = trafficLightStatus(healthScore);
  const analogy = React.useMemo(() => buildAnalogy(deepPacket), [deepPacket]);

  const [reportContext, setReportContext] = React.useState<ReportContext>(() => ({ resting: true, medications: [] }));

  const cvData = React.useMemo(() => {
    const v = deepPacket?.layer1.timeSeries.voltageVsCurrent.v_V ?? [];
    const i = deepPacket?.layer1.timeSeries.voltageVsCurrent.i_uA ?? [];
    const n = Math.min(v.length, i.length);
    const pts: Array<{ v_V: number; i_uA: number; featureIndex: number }> = [];
    for (let k = 0; k < n; k++) {
      pts.push({ v_V: v[k]!, i_uA: i[k]!, featureIndex: k % 88 });
    }
    return pts;
  }, [deepPacket]);

  const eisData = React.useMemo(() => (deepPacket ? makeNyquistFromFeatures(deepPacket) : []), [deepPacket]);

  const [report, setReport] = React.useState<GeneratedReport | null>(null);

  const regenerateReport = React.useCallback(async () => {
    if (!deepPacket) {
      setReport(null);
      return;
    }

    try {
      // Best-effort: cache DeepAnalysisPacket on server once, so report request can be id-only.
      // This keeps /api/report payload small and enables server-side lookup by deepPacketId.
      try {
        await fetch("/api/deep-packet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packet: deepPacket })
        });
      } catch {
        // ignore cache failures; /api/report can still fall back to local simulation
      }

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile,
          deepPacketId: deepPacket.id,
          context: reportContext,
          mode: "rag"
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const next = json?.report as GeneratedReport | undefined;
      if (!next?.bodyText) throw new Error("Invalid report response");
      setReport(next);
    } catch (e) {
      // fallback to local simulation
      setReport(generateSimulatedReport({ userProfile, deepPacket, context: reportContext }));
      toast({
        title: "서버 리포트 생성 실패 → 로컬 시뮬로 대체",
        description: e instanceof Error ? e.message : String(e),
        variant: "warning"
      });
    }
  }, [deepPacket, userProfile, reportContext, toast]);

  React.useEffect(() => {
    regenerateReport();
  }, [regenerateReport]);

  const focusOxidationPeak = React.useCallback(() => {
    setMode("pro");
    setFocusedFeature(42);
    // ensure charts are visible
    setTimeout(() => {
      proRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const focusedCvPoint = React.useMemo(() => {
    if (focusedFeature === null) return null;
    const candidates = cvData.filter((p) => p.featureIndex === focusedFeature);
    if (candidates.length === 0) return null;
    // choose the strongest (max current) as "peak"
    return candidates.reduce((best, cur) => (cur.i_uA > best.i_uA ? cur : best), candidates[0]!);
  }, [cvData, focusedFeature]);

  const cvDomain = React.useMemo(() => {
    if (!focusedCvPoint) return ["dataMin", "dataMax"] as const;
    const v = focusedCvPoint.v_V;
    const pad = 0.12;
    return [Number((v - pad).toFixed(3)), Number((v + pad).toFixed(3))] as const;
  }, [focusedCvPoint]);

  const handleDownloadCsv = () => {
    const rows: Array<Record<string, unknown>> = [];
    cvData.forEach((p) => rows.push({ type: "CV", v_V: p.v_V, i_uA: p.i_uA, featureIndex: p.featureIndex }));
    eisData.forEach((p) => rows.push({ type: "EIS", zRe_Ohm: p.zRe, zImNeg_Ohm: p.zImNeg, featureIndex: p.featureIndex }));
    const csv = toCsv(rows);
    downloadTextFile(`manpasik-raw-${Date.now()}.csv`, csv, "text/csv");
  };

  const handleExportMatlab = () => {
    const cvV = cvData.map((p) => p.v_V);
    const cvI = cvData.map((p) => p.i_uA);
    const eisRe = eisData.map((p) => p.zRe);
    const eisIm = eisData.map((p) => p.zImNeg);

    const m = [
      "% Manpasik Export (demo)",
      "% CV: voltage V, current uA",
      `cv_v = [${cvV.join(" ")}];`,
      `cv_i = [${cvI.join(" ")}];`,
      "% EIS Nyquist: Z' (Ohm), -Z'' (Ohm)",
      `eis_re = [${eisRe.join(" ")}];`,
      `eis_im = [${eisIm.join(" ")}];`,
      "figure; subplot(1,2,1); plot(cv_v, cv_i); xlabel('V'); ylabel('I (uA)'); title('CV Curve'); grid on;",
      "subplot(1,2,2); plot(eis_re, eis_im, '-o'); xlabel('Z'' (Ohm)'); ylabel('-Z'''' (Ohm)'); title('EIS Nyquist'); grid on;"
    ].join("\n");
    downloadTextFile(`manpasik-export-${Date.now()}.m`, m, "text/x-matlab");
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Analysis Mode</div>
        <div className="relative inline-flex items-center rounded-full border bg-white/60 p-1">
          <motion.div
            className="absolute top-1 bottom-1 w-1/2 rounded-full bg-sky-600"
            animate={{ x: mode === "simple" ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 35 }}
          />
          <button
            className={cn("relative z-10 px-3 py-1 text-xs font-semibold rounded-full transition-colors", mode === "simple" ? "text-white" : "text-slate-700")}
            onClick={() => setMode("simple")}
          >
            Simple View
          </button>
          <button
            className={cn("relative z-10 px-3 py-1 text-xs font-semibold rounded-full transition-colors", mode === "pro" ? "text-white" : "text-slate-700")}
            onClick={() => setMode("pro")}
          >
            Pro View
          </button>
        </div>
      </div>

      <div className="mt-3">
        <AnimatePresence mode="wait">
          {mode === "simple" ? (
            <motion.div
              key="simple"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="rounded-2xl border bg-white/70 p-4"
            >
              <div className="mb-4">
                <div className="space-y-3">
                  <ReportContextControls value={reportContext} onChange={setReportContext} />
                  <ReportSmartCard
                    report={report}
                    goals={(userProfile.goals as any) ?? []}
                    onGenerate={regenerateReport}
                    onFocusOxidationPeak={focusOxidationPeak}
                  />
                </div>
              </div>
              {/* Traffic light */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">상태</div>
                  <div className="text-xl font-bold mt-0.5">{tl.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Score <span className="font-mono text-foreground">{healthScore}</span>/100
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Lactate <span className="font-mono text-foreground">{concentrationMmolL.toFixed(2)}</span> mmol/L
                    {typeof uncertaintyAbs === "number" ? (
                      <span className="ml-2">±{uncertaintyAbs.toFixed(2)}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {(["bg-emerald-500", "bg-amber-500", "bg-rose-500"] as const).map((c, idx) => {
                    const active = idx === tl.idx;
                    return (
                      <div
                        key={c}
                        className={cn(
                          "w-14 h-14 rounded-full border",
                          c,
                          active ? "ring-4 ring-white shadow-lg" : "opacity-30"
                        )}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-xl border bg-white p-3">
                <div className="text-xs text-muted-foreground">의미(Analogy)</div>
                <div className="mt-1 font-semibold">{analogy.headline}</div>
                <div className="mt-1 text-sm text-slate-700">{analogy.meaning}</div>
              </div>

              <div className="mt-3 rounded-xl border bg-sky-50 p-3">
                <div className="text-xs text-muted-foreground">Action Item</div>
                <div className="mt-1 text-sm font-semibold text-sky-900">{analogy.action}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="rounded-2xl border bg-white/70 p-4"
            >
              <div className="mb-4" ref={proRef}>
                <div className="space-y-3">
                  <ReportContextControls value={reportContext} onChange={setReportContext} />
                  <ReportSmartCard
                    report={report}
                    goals={(userProfile.goals as any) ?? []}
                    onGenerate={regenerateReport}
                    onFocusOxidationPeak={focusOxidationPeak}
                  />
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Pro View (Expert)</div>
                  <div className="text-sm font-semibold mt-0.5">Data Purity · Feature Inspector</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleDownloadCsv}>
                    <Download className="w-4 h-4 mr-1" />
                    Raw CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExportMatlab}>
                    <Download className="w-4 h-4 mr-1" />
                    MATLAB
                  </Button>
                </div>
              </div>

              {!deepPacket ? (
                <div className="mt-4 text-sm text-muted-foreground">
                  DeepAnalysisPacket이 없어 Pro View 차트를 표시할 수 없습니다.
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">CV Curve (sim)</div>
                      <Badge variant="secondary" className="text-[10px]">
                        Hover for feature
                      </Badge>
                    </div>
                    <div className="h-[240px] mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cvData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="v_V" tick={{ fontSize: 11 }} domain={cvDomain as any} type="number" />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip content={<CVTooltip />} />
                          <Line type="monotone" dataKey="i_uA" stroke="#0ea5e9" dot={false} strokeWidth={2} />
                          {focusedCvPoint && (
                            <ReferenceLine x={focusedCvPoint.v_V} stroke="#ef4444" strokeDasharray="4 4" />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {focusedFeature !== null && (
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <div className="text-muted-foreground">
                          Focus: <span className="font-mono text-foreground">{featureLabel(focusedFeature)}</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setFocusedFeature(null)}>
                          Clear focus
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">EIS Nyquist (sim)</div>
                      <Badge variant="secondary" className="text-[10px]">
                        Hover for feature
                      </Badge>
                    </div>
                    <div className="h-[240px] mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="zRe" name="Z′" unit="Ω" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="zImNeg" name="−Z″" unit="Ω" tick={{ fontSize: 11 }} />
                          <ZAxis type="number" dataKey="featureIndex" range={[10, 10]} />
                          <Tooltip content={<EISTooltip />} />
                          <Scatter data={eisData} fill="#16a34a" line={{ stroke: "#16a34a" }} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-3 lg:col-span-2">
                    <div className="text-sm font-semibold">Quality Snapshot</div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="rounded-lg border bg-slate-50 p-2">
                        <div className="text-muted-foreground">SNR</div>
                        <div className="font-mono">{deepPacket.layer2.signalToNoiseRatio.toFixed(2)}</div>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-2">
                        <div className="text-muted-foreground">Diffusion</div>
                        <div className="font-mono">{deepPacket.layer2.diffusionCoefficient.toFixed(6)}</div>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-2">
                        <div className="text-muted-foreground">Kinetics</div>
                        <div className="font-mono">{deepPacket.layer2.reactionKinetics.toFixed(4)}</div>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-2">
                        <div className="text-muted-foreground">Permeability</div>
                        <div className="font-mono">{deepPacket.layer2.membranePermeability.toFixed(3)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


