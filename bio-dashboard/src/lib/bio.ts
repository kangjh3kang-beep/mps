// MeasurementResult schema (v2) supports deep analysis packet pointer while keeping legacy fields.
export type Measurement = {
  schemaVersion?: 2;
  id: string;
  ts: number; // epoch ms
  concentrationMmolL: number;
  calibratedVoltageV: number;
  rawA_V: number;
  rawB_V: number;
  diff_V: number;
  /** pointer to heavy DeepAnalysisPacket stored separately */
  deepPacketId?: string;
  /** optional Layer 3 clinical summary (duplicated) */
  layer3?: {
    concentration: number;
    unit: "mmol/L" | "mg/dL";
    confidenceIntervalAbs: number;
    confidenceIntervalPct: number;
  };
};

export type SensorStepLog = {
  ts: number;
  lines: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round(n: number, digits = 2) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function randn() {
  // Box–Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function concentrationToVoltage(conc: number) {
  // toy linear calibration: V = offset + slope * conc
  const offset = 0.1;
  const slope = 0.35;
  return offset + slope * conc;
}

export function voltageToConcentration(v: number) {
  const offset = 0.1;
  const slope = 0.35;
  return (v - offset) / slope;
}

export function kalman1D(
  z: number,
  prev: { x: number; p: number },
  params: { q: number; r: number }
) {
  // x_k = x_{k-1}, p_k = p_{k-1} + q
  const xPred = prev.x;
  const pPred = prev.p + params.q;

  // K = p / (p + r)
  const k = pPred / (pPred + params.r);
  const x = xPred + k * (z - xPred);
  const p = (1 - k) * pPred;
  return { x, p, k };
}

export function computeHealthScore(latestConc: number, trend7d: number[]) {
  // Very simple heuristic:
  // - ideal lactate zone near 0.8~1.6 mmol/L
  // - penalty when higher, plus penalty for high variability
  const base = 92;
  const highPenalty = Math.max(0, latestConc - 1.6) * 22; // up to ~50
  const lowPenalty = Math.max(0, 0.7 - latestConc) * 15;
  const mean =
    trend7d.reduce((a, b) => a + b, 0) / Math.max(1, trend7d.length);
  const variance =
    trend7d.reduce((a, b) => a + (b - mean) ** 2, 0) /
    Math.max(1, trend7d.length);
  const std = Math.sqrt(variance);
  const variabilityPenalty = std * 14;
  const score = base - highPenalty - lowPenalty - variabilityPenalty;
  return Math.round(clamp(score, 0, 100));
}

export function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-sky-600";
  return "text-rose-600";
}

export function scoreStroke(score: number) {
  if (score >= 80) return "#16a34a"; // emerald/green
  if (score >= 50) return "#0284c7"; // sky/blue
  return "#e11d48"; // rose/red
}

export function makeInitial7dTrend(now = Date.now()) {
  const points: { ts: number; concentrationMmolL: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const ts = now - i * 24 * 60 * 60 * 1000;
    const base = 1.1 + 0.15 * Math.sin(i / 2);
    const conc = clamp(base + randn() * 0.12, 0.6, 2.4);
    points.push({ ts, concentrationMmolL: round(conc, 2) });
  }
  return points;
}

export function simulateSensorMeasurement(opts?: {
  targetConc?: number;
  now?: number;
}) {
  const now = opts?.now ?? Date.now();
  const targetConc = opts?.targetConc ?? clamp(1.2 + randn() * 0.25, 0.6, 2.8);

  // Differential measurement model:
  // - channel A: signal + noise
  // - channel B: reference + correlated noise
  // - diff cancels correlated component
  const trueV = concentrationToVoltage(targetConc);
  const correlated = randn() * 0.02; // shared noise
  const noiseA = randn() * 0.01;
  const noiseB = randn() * 0.01;
  const rawA = trueV + correlated + noiseA;
  const rawB = 0.1 + correlated + noiseB; // reference baseline
  const diff = rawA - rawB;

  // "Recovered" voltage (add reference back)
  const recoveredV = diff + 0.1;

  // Kalman filter over recovered voltage (single-step; state kept in caller)
  const log: SensorStepLog = {
    ts: now,
    lines: [
      `Raw A: ${round(rawA, 3)} V`,
      `Raw B(ref): ${round(rawB, 3)} V`,
      `Differential(A-B): ${round(diff, 3)} V  (공통 노이즈 상쇄 가정)`,
      `Recovered V: ${round(recoveredV, 3)} V`
    ]
  };

  return {
    now,
    targetConc,
    rawA_V: rawA,
    rawB_V: rawB,
    diff_V: diff,
    recoveredV,
    log
  };
}

export function makeMockCoachAnswer(args: {
  question: string;
  last3: number[];
  last7: number[];
}) {
  const q = args.question.trim();
  const mean = (xs: number[]) =>
    xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const avg3 = mean(args.last3);
  const avg7 = mean(args.last7);
  const deltaPct = avg7 === 0 ? 0 : ((avg3 - avg7) / avg7) * 100;

  const fatigue =
    q.includes("피곤") || q.includes("피로") || q.includes("지침");

  if (fatigue) {
    const direction = deltaPct >= 0 ? "높습니다" : "낮습니다";
    const absPct = Math.abs(deltaPct);
    const pctText = `${Math.round(absPct)}%`;
    const advice =
      deltaPct >= 10
        ? "회복(수면/저강도 활동) 비중을 늘리고, 고강도 운동은 24–48시간 줄여보세요."
        : "최근 수치는 비교적 안정적이니, 수면 질/수분/식사 타이밍을 함께 점검해보세요.";
    return `최근 3일간 젖산 수치가 7일 평균 대비 ${pctText} ${direction}. ${advice}`;
  }

  if (q.length === 0) return "궁금한 점을 입력해 주세요.";

  return `현재 패턴을 보면 젖산 수치가 완만히 변동하고 있어요. 오늘 컨디션(수면/스트레스/운동량)에 맞춰 강도를 조절해보세요.`;
}


