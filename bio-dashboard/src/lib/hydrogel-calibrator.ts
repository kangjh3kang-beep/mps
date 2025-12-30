/**
 * Hydrogel Solid-State Measurement Logic (v72 patent-inspired)
 *
 * Auto-detection via quick impedance check @ 1kHz:
 * - 1kΩ < Z < 50kΩ and Phase ~ 0  -> Solid Contact via Hydrogel
 * - Z > 10MΩ                      -> Open Air (Gas mode)
 * - Z < 500Ω                      -> Liquid Immersion
 *
 * Baseline subtraction:
 * - Z_sample = Z_measured - Z_gel
 */

export type ContactMedium = "solid_hydrogel" | "open_air" | "liquid_immersion" | "unknown";

export interface ImpedanceReading {
  frequencyHz: number; // 1000
  magnitudeOhm: number;
  phaseDeg: number;
  timestamp: number;
}

export interface HydrogelDetectionResult {
  medium: ContactMedium;
  reading: ImpedanceReading;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export interface BaselineSubtractionResult {
  zMeasuredOhm: number;
  zGelOhm: number;
  zSampleOhm: number;
  clipped: boolean;
}

export function classifyContact(reading: ImpedanceReading): HydrogelDetectionResult {
  const Z = reading.magnitudeOhm;
  const phase = reading.phaseDeg;

  // Open air (gas)
  if (Z > 10_000_000) {
    return {
      medium: "open_air",
      reading,
      confidence: "high",
      reason: `Z=${Math.round(Z)}Ω > 10MΩ`
    };
  }

  // Liquid immersion
  if (Z < 500) {
    return {
      medium: "liquid_immersion",
      reading,
      confidence: "high",
      reason: `Z=${Math.round(Z)}Ω < 500Ω`
    };
  }

  // Solid contact via hydrogel: 1k..50k and phase close to 0
  if (Z > 1000 && Z < 50_000 && Math.abs(phase) <= 10) {
    return {
      medium: "solid_hydrogel",
      reading,
      confidence: "high",
      reason: `1kΩ<Z<50kΩ & |phase|<=10° (Z=${Math.round(Z)}Ω, phase=${phase.toFixed(1)}°)`
    };
  }

  // Otherwise unknown
  return {
    medium: "unknown",
    reading,
    confidence: "low",
    reason: `Outside thresholds (Z=${Math.round(Z)}Ω, phase=${phase.toFixed(1)}°)`
  };
}

export function baselineSubtractZ(zMeasuredOhm: number, zGelOhm: number): BaselineSubtractionResult {
  const raw = zMeasuredOhm - zGelOhm;
  const clipped = raw < 0;
  return {
    zMeasuredOhm,
    zGelOhm,
    zSampleOhm: clipped ? 0 : raw,
    clipped
  };
}

/**
 * Simulate a 1kHz impedance measurement.
 * Optional hint can bias toward a particular medium (for demo/testing).
 */
export function simulateImpedanceAt1kHz(hint?: ContactMedium): ImpedanceReading {
  const ts = Date.now();

  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  if (hint === "open_air") {
    return { frequencyHz: 1000, magnitudeOhm: rand(12_000_000, 80_000_000), phaseDeg: rand(-30, 30), timestamp: ts };
  }
  if (hint === "liquid_immersion") {
    return { frequencyHz: 1000, magnitudeOhm: rand(80, 420), phaseDeg: rand(-20, 20), timestamp: ts };
  }
  if (hint === "solid_hydrogel") {
    return { frequencyHz: 1000, magnitudeOhm: rand(2500, 18_000), phaseDeg: rand(-6, 6), timestamp: ts };
  }

  // Default: mostly hydrogel-like
  const dice = Math.random();
  if (dice < 0.7) return simulateImpedanceAt1kHz("solid_hydrogel");
  if (dice < 0.85) return simulateImpedanceAt1kHz("open_air");
  return simulateImpedanceAt1kHz("liquid_immersion");
}







