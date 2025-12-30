/**
 * Sensor Digital Twin & Life Prediction
 *
 * Patent-inspired degradation model:
 * RemainingLife = InitialCapacity - (UsageCount * WearFactor) - (TimeSinceOpen * OxidationFactor)
 *
 * Notes:
 * - WearFactor varies by test type (Sweat < Blood).
 * - This is a simulation model designed to be stable and user-friendly.
 */

export type TestType = "sweat" | "blood" | "gas" | "bio";

export interface EnvironmentalContext {
  temperatureC: number; // ambient
  humidityPct: number; // 0..100
}

export interface DegradationParams {
  initialCapacity: number;
  usageCount: number;
  wearFactor: number;
  timeSinceOpenHours: number;
  oxidationFactor: number;
}

export interface CartridgeLifePrediction {
  remainingLife: number; // capacity points
  remainingPct: number; // 0..100
  approxTestsRemaining: number; // rounded
  lowPrecisionHint?: string;
  wearFactor: number;
  oxidationLoss: number;
  wearLoss: number;
}

export const DEFAULT_INITIAL_CAPACITY = 100;

export const DEFAULT_OXIDATION_FACTOR_PER_HOUR = 0.15; // capacity points per hour (sim)

export function getWearFactor(testType: TestType): number {
  switch (testType) {
    case "sweat":
      return 3.5;
    case "blood":
      return 7.5;
    case "gas":
      return 2.5;
    case "bio":
      return 10.0;
    default:
      return 7.5;
  }
}

/**
 * Advanced wear factor:
 * - For gas cartridges only, humidity/temperature slightly increase wear (sensor contamination, drift).
 * - For other types, returns base wear factor unchanged.
 */
export function getWearFactorAdvanced(testType: TestType, env?: EnvironmentalContext): number {
  const base = getWearFactor(testType);
  if (testType !== "gas" || !env) return base;

  const h = clamp(env.humidityPct, 0, 100);
  const t = env.temperatureC;

  // Humidity effect: above 75% increases wear up to +25%
  const humidityMult = h <= 75 ? 1 : 1 + clamp((h - 75) / 25, 0, 1) * 0.25;
  // Temperature effect: above 30C increases wear up to +10%
  const tempMult = t <= 30 ? 1 : 1 + clamp((t - 30) / 15, 0, 1) * 0.1;

  return base * humidityMult * tempMult;
}

/**
 * Oxidation factor per hour:
 * - For gas cartridges only, humidity/temperature strongly affect oxidation/degradation
 * - For other types, returns DEFAULT_OXIDATION_FACTOR_PER_HOUR
 */
export function getOxidationFactorPerHour(testType: TestType, env?: EnvironmentalContext): number {
  const base = DEFAULT_OXIDATION_FACTOR_PER_HOUR;
  if (testType !== "gas" || !env) return base;

  const h = clamp(env.humidityPct, 0, 100);
  const t = env.temperatureC;

  // Humidity multiplier:
  // - <=40%: slight reduction (0.85x)
  // - 40..70%: baseline (1.0x)
  // - 70..100%: up to 2.2x
  const humidityMult =
    h <= 40
      ? 0.85
      : h <= 70
        ? 1
        : 1 + clamp((h - 70) / 30, 0, 1) * 1.2;

  // Temperature multiplier around 25C:
  // - below 15C: 0.85x
  // - 15..25C: 1.0x
  // - above 25C: up to 1.9x at 45C
  const tempMult =
    t <= 15
      ? 0.85
      : t <= 25
        ? 1
        : 1 + clamp((t - 25) / 20, 0, 1) * 0.9;

  return base * humidityMult * tempMult;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function computeRemainingLife(params: DegradationParams): CartridgeLifePrediction {
  const wearLoss = params.usageCount * params.wearFactor;
  const oxidationLoss = params.timeSinceOpenHours * params.oxidationFactor;
  const remainingLife = params.initialCapacity - wearLoss - oxidationLoss;
  const remainingLifeClamped = Math.max(0, remainingLife);
  const remainingPct = clamp((remainingLifeClamped / params.initialCapacity) * 100, 0, 100);

  // Approx tests remaining: divide by wearFactor
  const approxTestsRemaining =
    params.wearFactor > 0 ? Math.max(0, Math.round(remainingLifeClamped / params.wearFactor)) : 0;

  return {
    remainingLife: remainingLifeClamped,
    remainingPct,
    approxTestsRemaining,
    wearFactor: params.wearFactor,
    oxidationLoss,
    wearLoss
  };
}

export function hoursSince(ts: number, now = Date.now()): number {
  return Math.max(0, (now - ts) / (1000 * 60 * 60));
}

/**
 * Utility: choose test type from RAFE category / analyte context.
 */
export function inferTestType(opts: { rafeCategory?: "liquid" | "gas" | "bio" | "none"; sampleType?: "sweat" | "blood" }): TestType {
  if (opts.sampleType) return opts.sampleType;
  if (opts.rafeCategory === "gas") return "gas";
  if (opts.rafeCategory === "bio") return "bio";
  // liquid default: blood
  return "blood";
}


