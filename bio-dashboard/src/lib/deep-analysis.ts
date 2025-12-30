/**
 * Multi-Layered Insight System (Deep Analysis)
 *
 * Layer 1: Raw Physics (Scientist)
 * Layer 2: Processed Features (Engineer)
 * Layer 3: Clinical Result (User)
 * Layer 4: Semantic Interpretation (AI)
 *
 * Storage strategy:
 * - Measurement summary stays in the main measurement list (small)
 * - Heavy DeepAnalysisPacket (time-series + 88-dim vector) stored in a separate localStorage table
 */

import type { CalibrationParameters } from "@/lib/cartridge";

export type RafeConfigRef = {
  /** Stable-ish id for the configuration used during measurement */
  configId: string;
  targetAnalyte: string;
  mode: string;
  activePins: number[];
};

export type RawPhysicsLayer = {
  featureVector88: number[]; // 88-dim
  timeSeries: {
    currentVsTime: { t_s: number[]; i_uA: number[] };
    voltageVsCurrent: { v_V: number[]; i_uA: number[] };
  };
  metadata: {
    tempC: number;
    humidityPct: number;
    calibrationCoefficientsUsed: {
      sensitivityFactor: number;
      offsetCorrection_mV: number;
      temperatureCoefficient: number;
      batchCode: string;
      precision?: "high" | "low";
      uncertaintyPct?: number;
      source?: "NFC" | "QR" | "CLOUD" | "UNIVERSAL";
    } | null;
    rafeConfigId: string;
  };
};

export type ProcessedFeaturesLayer = {
  diffusionCoefficient: number; // (sim) arbitrary units
  reactionKinetics: number; // (sim) k0
  membranePermeability: number; // (sim) 0..1
  signalToNoiseRatio: number; // dB-like
};

export type ClinicalResultLayer = {
  concentration: number;
  unit: "mmol/L" | "mg/dL";
  confidenceIntervalAbs: number; // ±
  confidenceIntervalPct: number; // ±%
};

export type SemanticLayer = {
  ai_interpretation_log: Record<string, unknown>;
};

export type DeepAnalysisPacket = {
  id: string; // packet id
  measurementId: string;
  createdAtUtc: string;
  layer1: RawPhysicsLayer;
  layer2: ProcessedFeaturesLayer;
  layer3: ClinicalResultLayer;
  layer4: SemanticLayer;
};

export type MeasurementResult = {
  /** Schema version for forward compatibility */
  schemaVersion?: 2;

  id: string;
  ts: number;

  /** Layer 3 convenience (existing UI depends on mmol/L lactate trend) */
  concentrationMmolL: number;
  /** existing voltage fields */
  calibratedVoltageV: number;
  rawA_V: number;
  rawB_V: number;
  diff_V: number;

  /** optional pointer to deep packet */
  deepPacketId?: string;
  /** clinical summary (duplicated for convenience) */
  layer3?: ClinicalResultLayer;
};

const LS_DEEP = "manpasik:deepAnalysis:v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const normalize = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(normalize);
    if (seen.has(v)) return "[Circular]";
    seen.add(v);
    const keys = Object.keys(v).sort();
    const out: Record<string, any> = {};
    for (const k of keys) out[k] = normalize(v[k]);
    return out;
  };
  return JSON.stringify(normalize(value));
}

function randn() {
  // Box–Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeSNR(signal: number[], noise: number[]): number {
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const variance = (xs: number[]) => {
    const m = mean(xs);
    return xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length);
  };
  const s = Math.sqrt(variance(signal));
  const n = Math.sqrt(variance(noise));
  if (n === 0) return 60;
  return 20 * Math.log10(Math.max(1e-9, s / n));
}

function makeFeatureVector88(args: {
  rawPairs: { a: number[]; b: number[] };
  recoveredV: number;
  tempC: number;
  humidityPct: number;
  snr: number;
}): number[] {
  const vec: number[] = [];
  const push = (x: number) => vec.push(Number.isFinite(x) ? x : 0);

  const a = args.rawPairs.a;
  const b = args.rawPairs.b;
  const n = Math.max(a.length, b.length, 1);
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);
  const min = (xs: number[]) => xs.reduce((m, x) => Math.min(m, x), Number.POSITIVE_INFINITY);
  const max = (xs: number[]) => xs.reduce((m, x) => Math.max(m, x), Number.NEGATIVE_INFINITY);
  const std = (xs: number[]) => {
    const m = mean(xs);
    return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, xs.length));
  };

  // basic stats
  push(n);
  push(mean(a));
  push(std(a));
  push(min(a));
  push(max(a));
  push(mean(b));
  push(std(b));
  push(min(b));
  push(max(b));

  // diff stats
  const diff = a.map((x, i) => x - (b[i] ?? 0));
  push(mean(diff));
  push(std(diff));
  push(min(diff));
  push(max(diff));

  // env
  push(args.tempC);
  push(args.humidityPct);
  push(args.recoveredV);
  push(args.snr);

  // fill remaining with deterministic-ish features (toy harmonics)
  while (vec.length < 88) {
    const i = vec.length;
    push(Math.sin(i / 7) * 0.5 + Math.cos(i / 11) * 0.25 + randn() * 0.02);
  }

  return vec.slice(0, 88);
}

function makeTimeSeries(args: { recoveredV: number; concMmolL: number }) {
  // High-res time series simulation (compact but "high-resolution" enough for demo)
  const N = 160;
  const t_s: number[] = [];
  const i_uA: number[] = [];
  const tau = clamp(0.15 + args.concMmolL * 0.05, 0.08, 0.35);
  const i0 = clamp(30 + args.concMmolL * 18, 10, 120);
  for (let i = 0; i < N; i++) {
    const t = i * 0.01; // 10ms steps
    const ideal = i0 * Math.exp(-t / tau) + 4;
    t_s.push(Number(t.toFixed(3)));
    i_uA.push(Number((ideal + randn() * 0.8).toFixed(3)));
  }

  // V-I curve
  const M = 120;
  const v_V: number[] = [];
  const i2_uA: number[] = [];
  const g = clamp(40 + args.concMmolL * 10, 20, 120); // conductance-like
  for (let i = 0; i < M; i++) {
    const v = (i / (M - 1)) * 1.2;
    const ideal = g * v + Math.sin(v * 6) * 3;
    v_V.push(Number(v.toFixed(3)));
    i2_uA.push(Number((ideal + randn() * 1.2).toFixed(3)));
  }

  return {
    currentVsTime: { t_s, i_uA },
    voltageVsCurrent: { v_V, i_uA: i2_uA }
  };
}

function computeProcessed(layer1: RawPhysicsLayer): ProcessedFeaturesLayer {
  const i = layer1.timeSeries.currentVsTime.i_uA;
  const v = layer1.timeSeries.voltageVsCurrent.v_V;
  const iv = layer1.timeSeries.voltageVsCurrent.i_uA;

  // toy metrics
  const snr = layer1.featureVector88[17] ?? 20;
  const diffusionCoefficient = clamp(Math.abs(i[0] ?? 0) * 1e-6, 0, 1); // sim
  const reactionKinetics = clamp(Math.abs(iv[iv.length - 1] ?? 0) * 1e-3, 0, 10);
  const membranePermeability = clamp(0.5 + (snr / 60) * 0.4, 0, 1);
  const signalToNoiseRatio = Number((snr ?? 0).toFixed(2));
  return { diffusionCoefficient, reactionKinetics, membranePermeability, signalToNoiseRatio };
}

function lactateMmolLToMgDl(mmolL: number) {
  // Lactate MW ~90.08 g/mol => mg/dL = mmol/L * 9.008
  return mmolL * 9.008;
}

export function buildDeepAnalysisPacket(args: {
  measurementId: string;
  ts: number;
  concMmolL: number;
  recoveredV: number;
  rawVoltagePairs: Array<[number, number]>;
  tempC: number;
  humidityPct: number;
  calibration: CalibrationParameters | null;
  rafe: RafeConfigRef;
  aiInterpretation?: Record<string, unknown>;
}): { measurement: MeasurementResult; packet: DeepAnalysisPacket } {
  const a = args.rawVoltagePairs.map((p) => p[0]);
  const b = args.rawVoltagePairs.map((p) => p[1]);
  const diff = a.map((x, i) => x - (b[i] ?? 0));
  const snr = computeSNR(diff, b);

  const tsIso = new Date(args.ts).toISOString();
  const packetId = `DAP-${args.measurementId}`;

  const layer1: RawPhysicsLayer = {
    featureVector88: makeFeatureVector88({
      rawPairs: { a, b },
      recoveredV: args.recoveredV,
      tempC: args.tempC,
      humidityPct: args.humidityPct,
      snr
    }),
    timeSeries: makeTimeSeries({ recoveredV: args.recoveredV, concMmolL: args.concMmolL }),
    metadata: {
      tempC: args.tempC,
      humidityPct: args.humidityPct,
      calibrationCoefficientsUsed: args.calibration
        ? {
            sensitivityFactor: args.calibration.sensitivityFactor,
            offsetCorrection_mV: args.calibration.offsetCorrection,
            temperatureCoefficient: args.calibration.temperatureCoefficient,
            batchCode: args.calibration.batchCode,
            precision: args.calibration.precision,
            uncertaintyPct: args.calibration.uncertaintyPct,
            source: args.calibration.source
          }
        : null,
      rafeConfigId: args.rafe.configId
    }
  };

  const layer2 = computeProcessed(layer1);

  const ciPct = args.calibration?.uncertaintyPct ?? (args.calibration?.precision === "low" ? 12 : 4);
  const ciAbsMmol = args.concMmolL * (ciPct / 100);
  const layer3: ClinicalResultLayer = {
    concentration: Number(lactateMmolLToMgDl(args.concMmolL).toFixed(1)),
    unit: "mg/dL",
    confidenceIntervalAbs: Number(lactateMmolLToMgDl(ciAbsMmol).toFixed(1)),
    confidenceIntervalPct: Number(ciPct.toFixed(1))
  };

  const layer4: SemanticLayer = {
    ai_interpretation_log:
      args.aiInterpretation ?? {
        reason: "Differential + calibration applied; confidence based on calibration uncertainty",
        note: "Demo reasoning trace"
      }
  };

  const packet: DeepAnalysisPacket = {
    id: packetId,
    measurementId: args.measurementId,
    createdAtUtc: tsIso,
    layer1,
    layer2,
    layer3,
    layer4
  };

  const measurement: MeasurementResult = {
    schemaVersion: 2,
    id: args.measurementId,
    ts: args.ts,
    concentrationMmolL: Number(args.concMmolL.toFixed(2)),
    calibratedVoltageV: Number(args.recoveredV.toFixed(3)),
    rawA_V: Number((a[0] ?? 0).toFixed(3)),
    rawB_V: Number((b[0] ?? 0).toFixed(3)),
    diff_V: Number(((a[0] ?? 0) - (b[0] ?? 0)).toFixed(3)),
    deepPacketId: packetId,
    layer3
  };

  return { measurement, packet };
}

type DeepDb = Record<string, DeepAnalysisPacket>;

export const deepAnalysisStore = {
  get(id: string): DeepAnalysisPacket | null {
    if (!isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(LS_DEEP);
      if (!raw) return null;
      const db = JSON.parse(raw) as DeepDb;
      return db?.[id] ?? null;
    } catch {
      return null;
    }
  },

  put(packet: DeepAnalysisPacket) {
    if (!isBrowser()) return;
    try {
      const raw = window.localStorage.getItem(LS_DEEP);
      const db = (raw ? (JSON.parse(raw) as DeepDb) : {}) as DeepDb;
      db[packet.id] = packet;
      // cap size (keep last ~50 packets) by createdAtUtc
      const keys = Object.keys(db);
      if (keys.length > 50) {
        const sorted = keys
          .map((k) => ({ k, t: Date.parse(db[k]!.createdAtUtc) || 0 }))
          .sort((a, b) => a.t - b.t);
        const remove = sorted.slice(0, Math.max(0, keys.length - 50));
        for (const x of remove) delete db[x.k];
      }
      window.localStorage.setItem(LS_DEEP, stableStringify(db));
    } catch {
      // ignore
    }
  }
};







