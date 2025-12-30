"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  computeHealthScore,
  kalman1D,
  makeInitial7dTrend,
  simulateSensorMeasurement,
  voltageToConcentration,
  concentrationToVoltage,
  type Measurement
} from "@/lib/bio";
import { generateDeviceSignature } from "@/lib/security";
import {
  cartridgeRegistry,
  applyCalibration,
  type CartridgeInfo,
  type CalibrationParameters
} from "@/lib/cartridge";
import {
  federatedLearning,
  adaptiveCoaching,
  type CoachingPersonality
} from "@/lib/learning";
import { performanceMonitor, LATENCY_THRESHOLDS } from "@/lib/performance";
import { type ChatMessage, type ChatContext, generateContextAwareResponse, generateSystemAlert } from "@/components/dashboard/AICoachChat";
import { type SensorLog } from "@/components/dashboard/SensorSimulator";
import { type Appointment, appointmentManager } from "@/lib/telemedicine";
import { type Prescription } from "@/lib/prescription";
import {
  type PersonaId,
  type MultiPersonaContext,
  generatePersonaResponse,
  PERSONAS
} from "@/lib/persona-manager";
import { type HealthContext, type Cart, getCartManager } from "@/lib/mall";
import { getRAFEController } from "@/lib/rafe-controller";
import { getEHDDriver, type EHDSuctionLevel } from "@/lib/ehd-driver";
import {
  baselineSubtractZ,
  classifyContact,
  simulateImpedanceAt1kHz,
  type HydrogelDetectionResult
} from "@/lib/hydrogel-calibrator";
import { consentManager, anonymizePayload } from "@/lib/privacy-guard";
import { buildDeepAnalysisPacket, deepAnalysisStore } from "@/lib/deep-analysis";
import type { HealthGoal, UserProfile as DigitalTwinProfile } from "@/lib/profile";
import { emitAppCommand } from "@/lib/app-commands";
import { parseNaturalLanguageToTools } from "@/lib/action-agent";

/* ============================================
 * Types
 * ============================================
 */
export interface UserState {
  // Sensor & Health Data
  measurements: Measurement[];
  healthScore: number;
  latestConcentration: number;
  trend7: Measurement[];
  
  // Cartridge
  activeCartridge: CartridgeInfo | null;
  activeCalibration: CalibrationParameters | null;
  
  // Chat & Coaching
  chat: ChatMessage[];
  chatContext: ChatContext;
  coachingPersonality: CoachingPersonality;
  /** Digital Twin Goals (from /api/profile) */
  goals: HealthGoal[];
  
  // Telemedicine
  appointments: Appointment[];
  prescriptions: Prescription[];
  
  // Logs
  sensorLogs: SensorLog[];
  
  // Loading States
  isMeasuring: boolean;

  // Safety telemetry (for fail-safe hard coupling)
  lastSafetyTelemetry: { ts: number; maxTempC: number; maxVoltageV: number } | null;
  /** Global fail-safe lock: when set, measurement is hard-blocked across all modes */
  failSafeLock: { locked: boolean; reason: string; ts: number } | null;

  // Hydrogel / Solid-State Measurement
  hydrogelDetection: HydrogelDetectionResult | null;
  solidModeOverlayOpen: boolean;
  lastSolidSampleImpedanceOhm: number | null;
}

export interface UserActions {
  // Measurement
  handleMeasure: () => Promise<void>;
  confirmSolidHoldAndMeasure: () => Promise<void>;
  dismissSolidModeOverlay: () => void;
  beginSolidHoldFreeze: () => void;
  /** Support-only: clear fail-safe lock */
  clearFailSafeLock: () => void;
  
  // Cartridge
  handleCartridgeAuthenticated: (cartridge: CartridgeInfo, calibration: CalibrationParameters) => void;
  handleCartridgeRejected: (reason: string) => void;
  
  // Chat
  handleSendMessage: (text: string, fromVoice?: boolean, personaId?: PersonaId) => void;
  handleFeedback: (messageId: string, feedbackType: "positive" | "negative") => void;
  
  // Appointments
  addAppointment: (appointment: Appointment) => void;
  refreshAppointments: () => void;
  
  // Prescriptions
  addPrescription: (prescription: Prescription) => void;
  
  // Logs
  clearLogs: () => void;
  addLog: (log: SensorLog) => void;

  // Digital Twin Profile
  refreshProfile: () => Promise<void>;
}

export interface UserContextType extends UserState, UserActions {
  // Computed values
  hasLowHealthScore: boolean;
  upcomingAppointmentsCount: number;
  activePrescriptionsCount: number;
  cartridgeLibraryCount: number;
  dailyInsight: string;
  
  // Mall
  mallHealthContext: HealthContext;
  cartItemCount: number;
  refreshCart: () => void;

  // SDMS / RAFE
  rafeSelectedAnalyte: string | null;
  setRafeTargetAnalyte: (analyte: string) => Promise<void>;

  // Sensor Life / Digital Twin
  sampleType: "blood" | "sweat";
  setSampleType: (t: "blood" | "sweat") => void;
}

/* ============================================
 * Context
 * ============================================
 */
const UserContext = createContext<UserContextType | null>(null);

const LS_KEY = "bio-dashboard:v2";

type Persisted = {
  measurements: Measurement[];
  chat: ChatMessage[];
  logs: SensorLog[];
  kalman?: { x: number; p: number };
  prescriptions?: Prescription[];
  failSafeLock?: { locked: boolean; reason: string; ts: number } | null;
};

/* ============================================
 * Helper Functions
 * ============================================
 */
function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function upsertDay(measurements: Measurement[], m: Measurement) {
  const day = startOfDay(m.ts);
  const idx = measurements.findIndex((x) => startOfDay(x.ts) === day);
  const next = measurements.slice();
  if (idx >= 0) next[idx] = m;
  else next.push(m);
  next.sort((a, b) => a.ts - b.ts);
  return next.slice(-7);
}

function makeMeasurementFromTrendPoint(p: { ts: number; concentrationMmolL: number }): Measurement {
  const v = concentrationToVoltage(p.concentrationMmolL);
  return {
    id: `seed-${p.ts}`,
    ts: p.ts,
    concentrationMmolL: p.concentrationMmolL,
    calibratedVoltageV: v,
    rawA_V: v,
    rawB_V: 0.1,
    diff_V: v - 0.1
  };
}

function generateDailyInsight(healthScore: number, concentration: number, appointments: Appointment[]): string {
  const insights: string[] = [];
  
  // Health-based insights
  if (healthScore < 50) {
    insights.push("⚠️ 건강 점수가 낮습니다. 의사 상담을 권장합니다.");
  } else if (healthScore < 70) {
    insights.push("💛 오늘은 무리하지 말고 충분히 휴식하세요.");
  } else if (healthScore >= 90) {
    insights.push("💚 컨디션이 매우 좋습니다! 오늘도 좋은 하루 되세요.");
  } else {
    insights.push("💙 안정적인 상태입니다. 규칙적인 측정을 유지하세요.");
  }
  
  // Concentration-based
  if (concentration > 4) {
    insights.push("젖산 수치가 높습니다. 가벼운 스트레칭을 추천합니다.");
  }
  
  // Appointment reminder
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledTime);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString() && apt.status === "scheduled";
  });
  
  if (todayAppointments.length > 0) {
    insights.push(`📅 오늘 ${todayAppointments.length}건의 진료 예약이 있습니다.`);
  }
  
  return insights.join(" ");
}

/* ============================================
 * Provider
 * ============================================
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  // Core State
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [sensorLogs, setSensorLogs] = useState<SensorLog[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [lastSafetyTelemetry, setLastSafetyTelemetry] = useState<{ ts: number; maxTempC: number; maxVoltageV: number } | null>(
    null
  );
  const [failSafeLock, setFailSafeLock] = useState<{ locked: boolean; reason: string; ts: number } | null>(null);
  
  // Cartridge
  const [activeCartridge, setActiveCartridge] = useState<CartridgeInfo | null>(null);
  const [activeCalibration, setActiveCalibration] = useState<CalibrationParameters | null>(null);

  // Sample type (affects wear factor; sweat wears less than blood)
  const [sampleType, setSampleType] = useState<"blood" | "sweat">("blood");

  // Hydrogel / Solid-State
  const [hydrogelDetection, setHydrogelDetection] = useState<HydrogelDetectionResult | null>(null);
  const [solidModeOverlayOpen, setSolidModeOverlayOpen] = useState(false);
  const [lastSolidSampleImpedanceOhm, setLastSolidSampleImpedanceOhm] = useState<number | null>(null);
  const solidEhdPrevLevelRef = useRef<{ level: EHDSuctionLevel; appliedAt: number } | null>(null);
  
  // Coaching
  const [coachingPersonality, setCoachingPersonality] = useState<CoachingPersonality>("balanced");

  // Digital Twin Profile (goals)
  const [profile, setProfile] = useState<DigitalTwinProfile | null>(null);
  const goals = useMemo<HealthGoal[]>(() => profile?.goals ?? [], [profile?.goals]);
  
  // Telemedicine
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  
  // Refs
  const kalmanRef = useRef<{ x: number; p: number } | null>(null);
  const lastAlertScoreRef = useRef<number | null>(null);

  /* ---- Load from localStorage ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        setMeasurements(p.measurements ?? []);
        setSensorLogs(p.logs ?? []);
        setChat(p.chat ?? []);
        setPrescriptions(p.prescriptions ?? []);
        if (p.kalman) kalmanRef.current = p.kalman;
        if (p.failSafeLock) setFailSafeLock(p.failSafeLock);
        return;
      }
    } catch {
      // ignore
    }

    // Initialize with seed data
    const seed = makeInitial7dTrend().map(makeMeasurementFromTrendPoint);
    setMeasurements(seed);
    kalmanRef.current = { x: seed[seed.length - 1]?.calibratedVoltageV ?? 0.5, p: 1 };
    setChat([
      {
        id: "hello",
        role: "assistant",
        ts: Date.now(),
        text: "안녕하세요! 저는 AI Health Coach입니다. 오늘 컨디션은 어떠신가요? 건강 관련 질문이 있으시면 편하게 물어보세요."
      }
    ]);
  }, []);

  /* ---- Persist to localStorage ---- */
  useEffect(() => {
    const payload: Persisted = {
      measurements,
      logs: sensorLogs.slice(-30),
      chat: chat.slice(-50),
      kalman: kalmanRef.current ?? undefined,
      prescriptions: prescriptions.slice(-20),
      failSafeLock
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [measurements, sensorLogs, chat, prescriptions, failSafeLock]);

  /* ---- Digital Twin Profile: load from server (auth+mfa gated by middleware) ---- */
  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      if (json?.profile) setProfile(json.profile as DigitalTwinProfile);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    refreshProfile();
  }, [status, refreshProfile]);

  useEffect(() => {
    // Keep goals fresh after edits in another tab/page
    const onFocus = () => {
      if (status === "authenticated") refreshProfile();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [status, refreshProfile]);

  /* ---- Computed Values ---- */
  const latest = useMemo(() => 
    measurements.slice().sort((a, b) => b.ts - a.ts)[0], 
    [measurements]
  );
  
  const trend7 = useMemo(() => 
    measurements.slice().sort((a, b) => a.ts - b.ts), 
    [measurements]
  );
  
  const last7Conc = useMemo(() => 
    trend7.map((m) => m.concentrationMmolL), 
    [trend7]
  );
  
  const last3Conc = useMemo(() => 
    last7Conc.slice(-3), 
    [last7Conc]
  );

  const latestConcentration = latest?.concentrationMmolL ?? 0;

  const healthScore = useMemo(() => {
    return computeHealthScore(latestConcentration, last7Conc);
  }, [latestConcentration, last7Conc]);

  const chatContext: ChatContext = useMemo(() => ({
    last3: last3Conc,
    last7: last7Conc,
    currentConcentration: latestConcentration,
    currentHealthScore: healthScore,
    goals
  }), [last3Conc, last7Conc, latestConcentration, healthScore, goals]);

  const hasLowHealthScore = healthScore < 60;
  
  const upcomingAppointmentsCount = useMemo(() => 
    appointments.filter(apt => apt.status === "scheduled").length, 
    [appointments]
  );
  
  const activePrescriptionsCount = useMemo(() => 
    prescriptions.filter(rx => 
      rx.status === "signed" || rx.status === "sent_to_pharmacy"
    ).length, 
    [prescriptions]
  );

  // Cartridge Library Count (from ecosystem store)
  const cartridgeLibraryCount = 0; // Will be fetched from cartridge-ecosystem store on client

  const dailyInsight = useMemo(() => 
    generateDailyInsight(healthScore, latestConcentration, appointments),
    [healthScore, latestConcentration, appointments]
  );

  // Mall: Health Context for AI Recommendations
  const mallHealthContext: HealthContext = useMemo(() => ({
    lactateLevel: latestConcentration,
    healthScore: healthScore,
    sleepScore: 65 + Math.random() * 20, // Mock sleep score
    stressLevel: healthScore < 60 ? 75 : 45, // Derived from health score
    heartRate: 72 + Math.floor(Math.random() * 15)
  }), [latestConcentration, healthScore]);

  // Mall: Cart Item Count
  const [cartItemCount, setCartItemCount] = useState(0);
  
  const refreshCart = useCallback(() => {
    if (typeof window !== "undefined") {
      const cartManager = getCartManager();
      const cart = cartManager.getCart();
      setCartItemCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
    }
  }, []);

  // Initialize cart count on mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  /* ---- SDMS / RAFE (Reconfigurable Analog Front-End) ---- */
  const rafeController = useMemo(() => getRAFEController(), []);
  const [rafeSelectedAnalyte, setRafeSelectedAnalyte] = useState<string | null>(
    rafeController.getState().selectedAnalyte
  );

  useEffect(() => {
    // Keep UserContext in sync with the global RAFE controller (shared across modes)
    const unsubscribe = rafeController.subscribe((s) => {
      setRafeSelectedAnalyte(s.selectedAnalyte);
    });
    return unsubscribe;
  }, [rafeController]);

  const setRafeTargetAnalyte = useCallback(
    async (analyte: string) => {
      await rafeController.selectTargetAnalyte(analyte);
      // state will propagate via subscription, but set immediately for responsiveness
      setRafeSelectedAnalyte(rafeController.getState().selectedAnalyte);
    },
    [rafeController]
  );

  /* ---- EHD Auto Control Policy (Gas analyte → suction recommendation) ---- */
  const ehdDriver = useMemo(() => getEHDDriver(), []);

  useEffect(() => {
    // When the target analyte changes, apply an auto suction policy for gas sensing.
    // We avoid overriding if the user manually adjusted suction very recently.
    if (!rafeSelectedAnalyte) return;

    const analyte = rafeSelectedAnalyte.trim().toLowerCase();
    const isGas = analyte === "radon" || analyte === "vocs" || analyte === "ammonia" || analyte === "h2s" || analyte === "co2";
    const st = ehdDriver.getState();

    // only apply if auto control is enabled
    if (!st.autoControlEnabled) return;

    // don't fight user: skip if manual override within last 60s
    if (st.lastManualOverrideAt && Date.now() - st.lastManualOverrideAt < 60_000) return;

    const recommended: EHDSuctionLevel = isGas ? "high" : "low";
    if (st.suctionLevel !== recommended) {
      ehdDriver.setSuctionLevel(recommended, "auto");
      const entry: SensorLog = {
        ts: Date.now(),
        lines: [
          `=== EHD Auto Control ===`,
          `Target Analyte: ${rafeSelectedAnalyte}`,
          `Recommended Suction: ${recommended.toUpperCase()}`
        ]
      };
      setSensorLogs((prevL) => [...prevL.slice(-29), entry]);
    }
  }, [rafeSelectedAnalyte, ehdDriver]);

  /* ---- Rule-Based Alert (Part 5 Section 3.3) ---- */
  useEffect(() => {
    if (
      healthScore < 60 &&
      (lastAlertScoreRef.current === null || lastAlertScoreRef.current >= 60)
    ) {
      const alertText = generateSystemAlert(healthScore);
      if (alertText) {
        const systemMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          role: "system",
          ts: Date.now(),
          text: alertText
        };
        setChat((prev) => [...prev, systemMsg]);
      }
    }
    lastAlertScoreRef.current = healthScore;
  }, [healthScore]);

  /* ---- Federated Learning (Part 5 Section 5.2) ---- */
  useEffect(() => {
    const runFederatedLearning = async () => {
      if (measurements.length < 5) return;

      const trainingData = measurements.slice(-10).map(m => ({
        concentration: m.concentrationMmolL,
        healthScore: computeHealthScore(m.concentrationMmolL, last7Conc)
      }));

      const result = await federatedLearning.trainLocal(trainingData);
      
      if (result.success && process.env.NODE_ENV === 'development') {
        console.log("[FL] Training completed");
      }
    };

    const timeoutId = setTimeout(() => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(runFederatedLearning);
      } else {
        runFederatedLearning();
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [measurements.length, last7Conc]);

  /* ---- Actions ---- */
  const doMeasure = useCallback(async (opts?: { skipContactCheck?: boolean }) => {
    if (isMeasuring) return;

    // Global fail-safe lock: hard block measurement across all modes
    if (failSafeLock?.locked) {
      setSensorLogs((prevL) => [
        ...prevL.slice(-29),
        {
          ts: Date.now(),
          lines: [
            `=== FAIL-SAFE LOCK ===`,
            `🛑 Measurement blocked (global lock)`,
            `Reason: ${failSafeLock.reason}`,
            `Time: ${new Date(failSafeLock.ts).toISOString()}`
          ]
        }
      ]);
      return;
    }
    
    if (!activeCartridge || activeCartridge.status !== "valid") {
      const entry: SensorLog = {
        ts: Date.now(),
        lines: [
          `=== Measurement Blocked ===`,
          `❌ 유효한 카트리지가 없습니다.`,
          `카트리지 스캐너에서 먼저 카트리지를 인증해주세요.`
        ]
      };
      setSensorLogs((prevL) => [...prevL.slice(-29), entry]);
      return;
    }
    
    setIsMeasuring(true);
    performanceMonitor.start("E2E_TOTAL");
    performanceMonitor.start("MEASURE");

    const now = Date.now();

    try {
      let forcedTargetAnalyte: string | null = null;

      const isGasAnalyteId = (a: string) => {
        const x = a.trim().toLowerCase();
        return x === "radon" || x === "vocs" || x === "ammonia" || x === "h2s" || x === "co2";
      };

      const isLiquidAnalyteId = (a: string) => {
        const x = a.trim().toLowerCase();
        return x === "glucose" || x === "lactate" || x === "uric acid" || x === "cholesterol" || x === "ph";
      };

      const pickGasAnalyteFromPreference = () => {
        // shared with CartridgeScanner / HardwareTopologyWidget
        const LS_GAS_PREF_KEY = "manpasik:sdms:gasPreference"; // auto | radon | vocs
        try {
          const pref = localStorage.getItem(LS_GAS_PREF_KEY);
          if (pref === "vocs") return "VOCs";
          // default: auto or radon -> Radon
          return "Radon";
        } catch {
          return "Radon";
        }
      };

      const pickLiquidAnalyteFromLast = () => {
        const LS_LAST_LIQUID_KEY = "manpasik:sdms:lastLiquidAnalyte";
        try {
          const saved = localStorage.getItem(LS_LAST_LIQUID_KEY);
          if (saved && isLiquidAnalyteId(saved)) return saved;
        } catch {
          // ignore
        }
        return "Lactate";
      };

      const applyEhdPreset = (level: EHDSuctionLevel, reason: string) => {
        const st = ehdDriver.getState();
        if (!st.autoControlEnabled) {
          setSensorLogs((prevL) => [
            ...prevL.slice(-29),
            { ts: now, lines: [`[EHD] Auto preset skipped (autoControlDisabled): ${reason}`] }
          ]);
          return;
        }
        if (st.lastManualOverrideAt && Date.now() - st.lastManualOverrideAt < 60_000) {
          setSensorLogs((prevL) => [
            ...prevL.slice(-29),
            { ts: now, lines: [`[EHD] Auto preset skipped (recent manual override): ${reason}`] }
          ]);
          return;
        }
        if (!st.enabled || st.fault !== "NONE") {
          setSensorLogs((prevL) => [
            ...prevL.slice(-29),
            { ts: now, lines: [`[EHD] Auto preset skipped (fault/disabled: ${st.fault}): ${reason}`] }
          ]);
          return;
        }
        if (st.suctionLevel !== level) {
          ehdDriver.setSuctionLevel(level, "auto");
          setSensorLogs((prevL) => [
            ...prevL.slice(-29),
            { ts: now, lines: [`[EHD] Auto suction preset → ${level.toUpperCase()} (${reason})`] }
          ]);
        }
      };

      const restoreEhdIfSolidPresetApplied = (reason: string) => {
        const snap = solidEhdPrevLevelRef.current;
        if (!snap) return;

        const st = ehdDriver.getState();
        // Don't fight user: if user touched it after we applied, skip restore.
        if (st.lastManualOverrideAt && st.lastManualOverrideAt > snap.appliedAt) {
          solidEhdPrevLevelRef.current = null;
          setSensorLogs((prevL) => [
            ...prevL.slice(-29),
            { ts: now, lines: [`[EHD] Restore skipped (user manual override after solid preset): ${reason}`] }
          ]);
          return;
        }

        // Also don't restore if faulted/disabled or auto control disabled
        if (!st.autoControlEnabled || !st.enabled || st.fault !== "NONE") {
          solidEhdPrevLevelRef.current = null;
          setSensorLogs((prevL) => [
            ...prevL.slice(-29),
            { ts: now, lines: [`[EHD] Restore skipped (fault/disabled/autoOff): ${reason}`] }
          ]);
          return;
        }

        if (st.suctionLevel !== snap.level) {
          ehdDriver.setSuctionLevel(snap.level, "auto");
          setSensorLogs((prevL) => [
            ...prevL.slice(-29),
            { ts: now, lines: [`[EHD] Solid stabilization ended → restore ${snap.level.toUpperCase()} (${reason})`] }
          ]);
        }

        solidEhdPrevLevelRef.current = null;
      };

      // --- Hydrogel Solid-State Auto Detection (1kHz quick impedance check) ---
      if (!opts?.skipContactCheck) {
        const reading = simulateImpedanceAt1kHz();
        const detected = classifyContact(reading);
        setHydrogelDetection(detected);

        if (detected.medium === "solid_hydrogel") {
          // Strong coupling: stabilize contact by holding EHD at MED during the 3s hold step.
          // Save previous level for restore after overlay is closed.
          {
            const st = ehdDriver.getState();
            // Only capture if we are allowed to apply an auto preset (same guard rules inside applyEhdPreset).
            if (st.autoControlEnabled && (!st.lastManualOverrideAt || Date.now() - st.lastManualOverrideAt >= 60_000) && st.enabled && st.fault === "NONE") {
              solidEhdPrevLevelRef.current = { level: st.suctionLevel, appliedAt: Date.now() };
              applyEhdPreset("med", "contact=solid_hydrogel_stabilize");
            } else {
              // still log why we didn't force MED
              setSensorLogs((prevL) => [
                ...prevL.slice(-29),
                {
                  ts: now,
                  lines: [
                    `[EHD] Solid stabilization preset skipped (protected): ` +
                      `${!st.autoControlEnabled ? "autoOff" : st.fault !== "NONE" ? `fault=${st.fault}` : !st.enabled ? "disabled" : "recent manual override"}`
                  ]
                }
              ]);
            }
          }

          // Baseline subtraction using factory QC Z_gel (if available)
          const zGel = activeCalibration?.gelIntrinsicImpedanceOhm;
          if (typeof zGel === "number" && Number.isFinite(zGel)) {
            const bs = baselineSubtractZ(detected.reading.magnitudeOhm, zGel);
            setLastSolidSampleImpedanceOhm(bs.zSampleOhm);

            setSensorLogs((prevL) => [
              ...prevL.slice(-29),
              {
                ts: now,
                lines: [
                  `=== Hydrogel Solid Contact Detected ===`,
                  `Z_measured(1kHz): ${Math.round(bs.zMeasuredOhm)}Ω`,
                  `Z_gel(QC): ${Math.round(bs.zGelOhm)}Ω`,
                  `Z_sample = Z_measured - Z_gel: ${Math.round(bs.zSampleOhm)}Ω${bs.clipped ? " (clipped)" : ""}`,
                  `➡️ Solid Mode: hold 3s`
                ]
              }
            ]);
          } else {
            setSensorLogs((prevL) => [
              ...prevL.slice(-29),
              {
                ts: now,
                lines: [
                  `=== Hydrogel Solid Contact Detected ===`,
                  `Z_measured(1kHz): ${Math.round(detected.reading.magnitudeOhm)}Ω`,
                  `⚠️ Z_gel missing from QC → baseline subtraction skipped`,
                  `➡️ Solid Mode: hold 3s`
                ]
              }
            ]);
          }

          // Pause measurement until the UI hold step is completed
          setSolidModeOverlayOpen(true);
          performanceMonitor.end("MEASURE");
          performanceMonitor.end("E2E_TOTAL");
          setIsMeasuring(false);
          return;
        }

        // --- Contact Medium → SDMS Auto Mode Switching ---
        // Open air: force gas mode (Radon/VOCs) if we aren't already on a gas analyte.
        if (detected.medium === "open_air") {
          const current = (rafeSelectedAnalyte ?? "").trim();
          if (!current || !isGasAnalyteId(current)) {
            forcedTargetAnalyte = pickGasAnalyteFromPreference();
            setSensorLogs((prevL) => [
              ...prevL.slice(-29),
              {
                ts: now,
                lines: [
                  `=== Contact Medium → SDMS Auto Switch ===`,
                  `Detected: Open Air (Gas) @1kHz (${detected.reason})`,
                  `Auto Target: ${forcedTargetAnalyte} → MODE_GAS_HIGH_Z`
                ]
              }
            ]);
            // Strong coupling: apply EHD HIGH immediately (not waiting for analyte policy effect)
            applyEhdPreset("high", "contact=open_air");
          }
        }

        // Liquid immersion: force liquid EC mode (e.g., Lactate) if we aren't already on a liquid analyte.
        if (detected.medium === "liquid_immersion") {
          const current = (rafeSelectedAnalyte ?? "").trim();
          if (!current || !isLiquidAnalyteId(current)) {
            forcedTargetAnalyte = pickLiquidAnalyteFromLast();
            try { localStorage.setItem("manpasik:sdms:lastLiquidAnalyte", forcedTargetAnalyte); } catch {}

            setSensorLogs((prevL) => [
              ...prevL.slice(-29),
              {
                ts: now,
                lines: [
                  `=== Contact Medium → SDMS Auto Switch ===`,
                  `Detected: Liquid Immersion @1kHz (${detected.reason})`,
                  `Auto Target: ${forcedTargetAnalyte} → MODE_LIQUID_EC`
                ]
              }
            ]);
            // Strong coupling: for liquid, drop suction to LOW immediately
            applyEhdPreset("low", "contact=liquid_immersion");
          }
        }
      }

      // SDMS / RAFE: configure the analog front-end based on the selected target analyte
      const targetAnalyte = forcedTargetAnalyte ?? (rafeSelectedAnalyte ?? "Lactate");
      const { mode } = await rafeController.selectTargetAnalyte(targetAnalyte);

      // Log the virtual switch matrix state into the app logs (so users can see SDMS actions)
      const rafeState = rafeController.getState();
      const rafeLog: SensorLog = {
        ts: now,
        lines: [
          `=== SDMS / RAFE Config ===`,
          `Target Analyte: ${targetAnalyte}`,
          `Mode: ${mode}`,
          `Pins: ${rafeState.activePins.filter(p => p.isActive).map(p => `P${p.pin}(${p.name})`).join(", ") || "None"}`,
          ...rafeController.getSwitchMatrixLog().slice(0, 8)
        ]
      };
      setSensorLogs((prevL) => [...prevL.slice(-29), rafeLog]);

      // Record usage with test-type hint (wear factor varies by test type)
      const usageResult = cartridgeRegistry.recordUsage(activeCartridge.id, { testType: sampleType });
      
      const samples: { rawA: number; rawB: number }[] = [];
      for (let i = 0; i < 5; i++) {
        const sim = simulateSensorMeasurement({ now: now + i * 10 });
        samples.push({ rawA: sim.rawA_V, rawB: sim.rawB_V });
      }
      const sim = simulateSensorMeasurement({ now });

      let calibratedVoltage = sim.recoveredV;
      if (activeCalibration) {
        calibratedVoltage = applyCalibration(sim.recoveredV, activeCalibration, 25);
      }

      performanceMonitor.end("MEASURE", LATENCY_THRESHOLDS.MEASURE_PHASE);

      // Privacy Guard: enforce Research consent before any upload to /api/analyze
      const userId = "demo-user";
      const researchConsent = consentManager.isGranted(userId, "Research");
      const temperatureC = 25 + Math.random() * 5;
      const maxVoltageV = Math.max(
        ...samples.map((s) => Math.max(Math.abs(s.rawA), Math.abs(s.rawB))),
        Math.max(Math.abs(sim.rawA_V), Math.abs(sim.rawB_V), Math.abs(sim.recoveredV))
      );
      setLastSafetyTelemetry({ ts: now, maxTempC: temperatureC, maxVoltageV });

      // Global fail-safe: lock the system if hardware fault thresholds are exceeded
      if (temperatureC > 60 || maxVoltageV > 5) {
        const reason = temperatureC > 60
          ? `SensorTemp ${temperatureC.toFixed(1)}°C > 60°C`
          : `Voltage ${maxVoltageV.toFixed(2)}V > 5V`;
        const lock = { locked: true, reason, ts: now };
        setFailSafeLock(lock);
        setSensorLogs((prevL) => [
          ...prevL.slice(-29),
          {
            ts: now,
            lines: [
              `=== FAIL-SAFE LOCK ACTIVATED ===`,
              `🛑 Safe Mode Active - Contact Support`,
              `Reason: ${reason}`,
              `Telemetry: Temp=${temperatureC.toFixed(1)}°C, MaxV=${maxVoltageV.toFixed(2)}V`,
              `All measurements are now blocked across modes.`
            ]
          }
        ]);
        performanceMonitor.fail("E2E_TOTAL", new Error(`FAIL_SAFE_LOCK: ${reason}`));
        setIsMeasuring(false);
        return;
      }
      if (!researchConsent) {
        setSensorLogs((prevL) => [
          ...prevL.slice(-29),
          {
            ts: now,
            lines: [
              `=== Privacy Guard ===`,
              `❌ Research consent not granted → upload blocked`,
              `✅ Local analysis only (no /api/analyze call)`
            ]
          }
        ]);

        // Continue with local processing (no network). We'll skip ANALYZE phase.
        const prev = kalmanRef.current ?? { x: calibratedVoltage, p: 1 };
        const k1 = kalman1D(calibratedVoltage, prev, { q: 0.0008, r: 0.0009 });
        kalmanRef.current = { x: k1.x, p: k1.p };

        const conc = Math.max(0, voltageToConcentration(k1.x));
        const uncPct = activeCalibration?.uncertaintyPct ?? (activeCalibration?.precision === "low" ? 12 : 4);
        const concUnc = conc * (uncPct / 100);

        const anomalyDetected =
          (temperatureC < 15 || temperatureC > 40) || conc > 10 || conc < 0 || k1.x < 0 || k1.x > 2;

        const measured: Measurement = {
          id: `${now}`,
          ts: now,
          concentrationMmolL: Number(conc.toFixed(2)),
          calibratedVoltageV: Number(k1.x.toFixed(3)),
          rawA_V: Number(sim.rawA_V.toFixed(3)),
          rawB_V: Number(sim.rawB_V.toFixed(3)),
          diff_V: Number(sim.diff_V.toFixed(3))
        };

        // Deep Analysis Packet even in local-only mode
        try {
          const humidityPct = ehdDriver.getState().humidityPct ?? 50;
          const rafeStateNow = rafeController.getState();
          const { measurement, packet } = buildDeepAnalysisPacket({
            measurementId: measured.id,
            ts: now,
            concMmolL: conc,
            recoveredV: k1.x,
            rawVoltagePairs: voltagePairs,
            tempC: temperatureC,
            humidityPct,
            calibration: activeCalibration,
            rafe: {
              configId: `${rafeStateNow.mode}:${rafeStateNow.selectedAnalyte ?? targetAnalyte}`,
              targetAnalyte: targetAnalyte,
              mode: rafeStateNow.mode,
              activePins: rafeStateNow.activePins.filter((p) => p.isActive).map((p) => p.pin)
            },
            aiInterpretation: {
              reason: "Local analysis (upload blocked by Privacy Guard)",
              note: "No server processing log available"
            }
          });
          deepAnalysisStore.put(packet);
          measured.deepPacketId = measurement.deepPacketId;
          measured.layer3 = measurement.layer3;
        } catch {
          // ignore deep packet failures
        }

        const e2eMetric = performanceMonitor.end("E2E_TOTAL", LATENCY_THRESHOLDS.TOTAL_E2E);

        const entry: SensorLog = {
          ts: now,
          lines: [
            `=== Measurement Complete (Local) ===`,
            `Measurement ID: ${measured.id}`,
            `⚡ Latency: ${e2eMetric?.duration?.toFixed(1) ?? 0}ms`,
            `Concentration: ${measured.concentrationMmolL.toFixed(2)} mmol/L (±${concUnc.toFixed(2)})`,
            `Health Score: ${computeHealthScore(measured.concentrationMmolL, last7Conc)}`,
            `Anomaly: ${anomalyDetected ? "⚠️ Yes" : "✓ No"}`,
            `Cartridge: ${activeCartridge.id} (${usageResult.remaining ?? 0} left)`
          ]
        };

        setMeasurements((prevM) => upsertDay(prevM, measured));
        setSensorLogs((prevL) => [...prevL.slice(-29), entry]);
        return;
      }

      performanceMonitor.start("ANALYZE");

      const voltagePairs: [number, number][] = samples.map(s => [s.rawA, s.rawB]);
      const deviceId = "MPS-001";
      const deviceAuth = generateDeviceSignature(deviceId);
      
      // Optional: attach anonymized user data for research analytics (PII removed)
      const anonymizedUser = await anonymizePayload({
        name: "홍길동",
        phone: "+82-10-1234-5678",
        email: "demo@example.com",
        birthDate: "1990-03-15",
        location: { lat: 37.5665, lon: 126.9780, country: "KR" }
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "demo-user",
          device_id: deviceId,
          sensor_data: {
            raw_voltage: voltagePairs,
              temperature: temperatureC,
            cartridge_id: activeCartridge.id,
            calibration_code: activeCalibration?.batchCode
          },
          auth: deviceAuth,
          research_meta: {
            consent: true,
            anonymized_user: anonymizedUser
          }
        })
      });

      const apiResult = await response.json();

      performanceMonitor.end("ANALYZE", LATENCY_THRESHOLDS.ANALYZE_PHASE);

      const prev = kalmanRef.current ?? { x: calibratedVoltage, p: 1 };
      const k1 = kalman1D(calibratedVoltage, prev, { q: 0.0008, r: 0.0009 });
      kalmanRef.current = { x: k1.x, p: k1.p };

      const conc = Math.max(0, voltageToConcentration(k1.x));
      const uncPct = activeCalibration?.uncertaintyPct ?? (activeCalibration?.precision === "low" ? 12 : 4);
      const concUnc = conc * (uncPct / 100);

      // Deep Analysis Packet (4-layer bundle)
      const humidityPct = ehdDriver.getState().humidityPct ?? 50;
      const rafeStateNow = rafeController.getState();
      const { measurement, packet } = buildDeepAnalysisPacket({
        measurementId: `${now}`,
        ts: now,
        concMmolL: conc,
        recoveredV: k1.x,
        rawVoltagePairs: voltagePairs,
        tempC: temperatureC,
        humidityPct,
        calibration: activeCalibration,
        rafe: {
          configId: `${rafeStateNow.mode}:${rafeStateNow.selectedAnalyte ?? targetAnalyte}`,
          targetAnalyte: targetAnalyte,
          mode: rafeStateNow.mode,
          activePins: rafeStateNow.activePins.filter((p) => p.isActive).map((p) => p.pin)
        },
        aiInterpretation: apiResult?.processing?.log
          ? { reason: "Server processing log", log: apiResult.processing.log }
          : undefined
      });
      deepAnalysisStore.put(packet);

      const measured: Measurement = {
        ...measurement,
        // keep legacy voltage fields aligned with this measurement instance
        rawA_V: Number(sim.rawA_V.toFixed(3)),
        rawB_V: Number(sim.rawB_V.toFixed(3)),
        diff_V: Number(sim.diff_V.toFixed(3))
      };

      const e2eMetric = performanceMonitor.end("E2E_TOTAL", LATENCY_THRESHOLDS.TOTAL_E2E);

      const entry: SensorLog = {
        ts: now,
        lines: [
          `=== Measurement Complete ===`,
          `Measurement ID: ${measured.id}`,
          `⚡ Latency: ${e2eMetric?.duration?.toFixed(1) ?? 0}ms`,
          `Concentration: ${measured.concentrationMmolL.toFixed(2)} mmol/L (±${concUnc.toFixed(2)})`,
          `Health Score: ${computeHealthScore(measured.concentrationMmolL, last7Conc)}`,
          `Anomaly: ${apiResult.anomaly_detected ? '⚠️ Yes' : '✓ No'}`,
          `Cartridge: ${activeCartridge.id} (${usageResult.remaining ?? 0} left)`
        ]
      };

      setMeasurements((prevM) => upsertDay(prevM, measured));
      setSensorLogs((prevL) => [...prevL.slice(-29), entry]);
      
      if (!usageResult.success || usageResult.remaining === 0) {
        const updatedCartridge = cartridgeRegistry.getCartridge(activeCartridge.id);
        if (updatedCartridge) {
          setActiveCartridge(updatedCartridge);
        }
      }

      // H2E: Award points for daily measurement
      try {
        const pointsRes = await fetch("/api/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "daily_measurement",
            metadata: { measurementId: measured.id, concentration: measured.concentrationMmolL }
          })
        });
        const pointsJson = await pointsRes.json();
        if (pointsJson.success && process.env.NODE_ENV === 'development') {
          console.log(`[H2E] Earned ${pointsJson.earned} points (${pointsJson.multiplier}x). Balance: ${pointsJson.newBalance}`);
          if (pointsJson.tierUpgraded) {
            console.log(`[H2E] 🎉 Tier upgraded to ${pointsJson.newTier}!`);
          }
        }
      } catch (pointsErr) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("[H2E] Failed to award points:", pointsErr);
        }
      }

    } catch (err) {
      console.error("Measure error:", err);
      performanceMonitor.fail("E2E_TOTAL", err as Error);
      
      // Fallback to local processing
      const sim = simulateSensorMeasurement({ now });
      let calibratedVoltage = sim.recoveredV;
      if (activeCalibration) {
        calibratedVoltage = applyCalibration(sim.recoveredV, activeCalibration, 25);
      }
      
      const prev = kalmanRef.current ?? { x: calibratedVoltage, p: 1 };
      const k1 = kalman1D(calibratedVoltage, prev, { q: 0.0008, r: 0.0009 });
      kalmanRef.current = { x: k1.x, p: k1.p };

      const conc = Math.max(0, voltageToConcentration(k1.x));
      const measured: Measurement = {
        id: `${now}`,
        ts: now,
        concentrationMmolL: Number(conc.toFixed(2)),
        calibratedVoltageV: Number(k1.x.toFixed(3)),
        rawA_V: Number(sim.rawA_V.toFixed(3)),
        rawB_V: Number(sim.rawB_V.toFixed(3)),
        diff_V: Number(sim.diff_V.toFixed(3))
      };

      // Deep Analysis Packet for fallback path
      try {
        const humidityPct = ehdDriver.getState().humidityPct ?? 50;
        const rafeStateNow = rafeController.getState();
        const temperatureC = 25; // fallback assumes ambient
        const voltagePairs: [number, number][] = [[measured.rawA_V, measured.rawB_V]];
        const { measurement, packet } = buildDeepAnalysisPacket({
          measurementId: measured.id,
          ts: now,
          concMmolL: conc,
          recoveredV: k1.x,
          rawVoltagePairs: voltagePairs,
          tempC: temperatureC,
          humidityPct,
          calibration: activeCalibration,
          rafe: {
            configId: `${rafeStateNow.mode}:${rafeStateNow.selectedAnalyte ?? (rafeSelectedAnalyte ?? "Unknown")}`,
            targetAnalyte: rafeSelectedAnalyte ?? "Unknown",
            mode: rafeStateNow.mode,
            activePins: rafeStateNow.activePins.filter((p) => p.isActive).map((p) => p.pin)
          },
          aiInterpretation: {
            reason: "Fallback measurement (API/analyze unavailable)",
            error: (err as Error)?.message
          }
        });
        deepAnalysisStore.put(packet);
        measured.deepPacketId = measurement.deepPacketId;
        measured.layer3 = measurement.layer3;
      } catch {
        // ignore deep packet failures
      }

      setMeasurements((prevM) => upsertDay(prevM, measured));
      setSensorLogs((prevL) => [...prevL.slice(-29), { 
        ts: now, 
        lines: [
          `=== Measurement Complete (Fallback) ===`,
          `Measurement ID: ${measured.id}`,
          `Fallback measurement: ${measured.concentrationMmolL.toFixed(2)} mmol/L`
        ] 
      }]);
    } finally {
      setIsMeasuring(false);
    }
  }, [isMeasuring, failSafeLock, activeCartridge, activeCalibration, last7Conc, rafeController, rafeSelectedAnalyte, sampleType, ehdDriver]);

  const handleMeasure = useCallback(async () => {
    await doMeasure({ skipContactCheck: false });
  }, [doMeasure]);

  const confirmSolidHoldAndMeasure = useCallback(async () => {
    setSolidModeOverlayOpen(false);
    // End of stabilization window → unfreeze RAFE before measurement proceeds
    rafeController.unlockMode("SOLID_HOLD");
    // Hold complete → restore prior suction level if we forced MED for stabilization
    // (do this before the real measurement begins)
    try {
      const snap = solidEhdPrevLevelRef.current;
      if (snap) {
        const st = ehdDriver.getState();
        if (st.lastManualOverrideAt && st.lastManualOverrideAt > snap.appliedAt) {
          solidEhdPrevLevelRef.current = null;
        } else if (st.autoControlEnabled && st.enabled && st.fault === "NONE" && st.suctionLevel !== snap.level) {
          ehdDriver.setSuctionLevel(snap.level, "auto");
        }
        solidEhdPrevLevelRef.current = null;
      }
    } catch {
      solidEhdPrevLevelRef.current = null;
    }
    await doMeasure({ skipContactCheck: true });
  }, [doMeasure, ehdDriver, rafeController]);

  const dismissSolidModeOverlay = useCallback(() => {
    setSolidModeOverlayOpen(false);
    // Cancel stabilization → unfreeze RAFE
    rafeController.unlockMode("SOLID_HOLD");
    // User cancelled → restore prior suction level if we forced MED for stabilization
    try {
      const snap = solidEhdPrevLevelRef.current;
      if (snap) {
        const st = ehdDriver.getState();
        if (st.lastManualOverrideAt && st.lastManualOverrideAt > snap.appliedAt) {
          solidEhdPrevLevelRef.current = null;
          return;
        }
        if (st.autoControlEnabled && st.enabled && st.fault === "NONE" && st.suctionLevel !== snap.level) {
          ehdDriver.setSuctionLevel(snap.level, "auto");
        }
        solidEhdPrevLevelRef.current = null;
      }
    } catch {
      solidEhdPrevLevelRef.current = null;
    }
  }, [ehdDriver, rafeController]);

  const clearFailSafeLock = useCallback(() => {
    setFailSafeLock(null);
    setSensorLogs((prevL) => [
      ...prevL.slice(-29),
      { ts: Date.now(), lines: [`[FAIL-SAFE] Lock cleared (support action)`] }
    ]);
  }, []);

  const beginSolidHoldFreeze = useCallback(() => {
    rafeController.lockMode("SOLID_HOLD", "Hydrogel solid contact stabilization hold (3s)");
    setSensorLogs((prevL) => [
      ...prevL.slice(-29),
      { ts: Date.now(), lines: [`[RAFE] Freeze ON (SOLID_HOLD): 3s stabilization window`] }
    ]);
  }, [rafeController]);

  const handleCartridgeAuthenticated = useCallback((cartridge: CartridgeInfo, calibration: CalibrationParameters) => {
    setActiveCartridge(cartridge);
    setActiveCalibration(calibration);
    
    const uncPct = calibration.uncertaintyPct;
    const precision = calibration.precision;
    const precisionNote =
      precision === "low"
        ? `⚠️ Low Precision Mode (±${uncPct ?? 12}%)`
        : `✓ High Precision (±${uncPct ?? 4}%)`;

    const entry: SensorLog = {
      ts: Date.now(),
      lines: [
        `✓ Cartridge authenticated: ${cartridge.id}`,
        `Calibration: ${calibration.batchCode} (${calibration.source ?? "QC"})`,
        precisionNote,
        calibration.offlineFallback ? "📴 Offline detected → Universal coefficients applied" : ""
      ]
    };
    setSensorLogs((prevL) => [...prevL.slice(-29), entry]);
  }, []);

  const handleCartridgeRejected = useCallback((reason: string) => {
    setActiveCartridge(null);
    setActiveCalibration(null);
    
    const entry: SensorLog = {
      ts: Date.now(),
      lines: [`❌ Cartridge rejected: ${reason}`]
    };
    setSensorLogs((prevL) => [...prevL.slice(-29), entry]);
  }, []);

  const handleSendMessage = useCallback((text: string, fromVoice = false, personaId?: PersonaId) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", ts: Date.now(), text, fromVoice };
    
    // Action Agent: interpret commands first
    const toolCalls = parseNaturalLanguageToTools(text);
    if (toolCalls.length > 0) {
      const lines: string[] = [];
      const now = Date.now();

      // Execute tool calls
      for (const call of toolCalls) {
        if (call.tool === "Maps_to") {
          emitAppCommand({ id: `cmd-${now}-${Math.random().toString(16).slice(2)}`, type: "maps_to", page: call.args.page, analyte: call.args.analyte });
          if (call.args.page === "measure") {
            lines.push("측정 화면으로 이동합니다. 카트리지를 삽입해 주세요.");
          } else if (call.args.page === "store") {
            lines.push("스토어로 이동합니다.");
          } else if (call.args.page === "result") {
            lines.push("결과 화면으로 이동합니다.");
          } else if (call.args.page === "settings") {
            lines.push("설정/마이페이지로 이동합니다.");
          }
        }

        if (call.tool === "start_measurement") {
          const mode = call.args.mode?.toLowerCase();
          if (mode === "glucose" || mode === "lactate") {
            // Configure SDMS target analyte (best-effort)
            setRafeTargetAnalyte(mode).catch(() => void 0);
            emitAppCommand({ id: `cmd-${now}-${Math.random().toString(16).slice(2)}`, type: "start_measurement", mode });
            lines.push(`측정 모드를 ${mode === "glucose" ? "Glucose" : "Lactate"}로 설정했습니다.`);
          } else {
            emitAppCommand({ id: `cmd-${now}-${Math.random().toString(16).slice(2)}`, type: "start_measurement" });
            lines.push("측정을 시작할 준비가 되었습니다. 카트리지 삽입 후 Measure를 눌러주세요.");
          }
        }

        if (call.tool === "change_setting") {
          // Settings are stored in localStorage (SettingsProvider will react)
          try {
            const key = "manpasik:settings:v1";
            const raw = localStorage.getItem(key);
            const cur = raw ? JSON.parse(raw) : {};
            const next = { ...cur, [call.args.key]: call.args.value };
            // Senior mode implies larger fonts
            if (call.args.key === "seniorMode" && call.args.value === true) {
              next.fontScale = Math.max(Number(next.fontScale ?? 1.0), 1.25);
            }
            localStorage.setItem(key, JSON.stringify(next));
            lines.push(`설정을 변경했습니다: ${call.args.key}=${String(call.args.value)}`);
          } catch {
            lines.push("설정 변경에 실패했습니다.");
          }
        }

        if (call.tool === "fetch_data") {
          const metric = call.args.metric;
          const range = call.args.range;
          if (metric === "lactate") {
            const nowTs = Date.now();
            const from = range === "last_month" ? nowTs - 30 * 24 * 60 * 60 * 1000 : nowTs - 7 * 24 * 60 * 60 * 1000;
            const pts = measurements.filter((m) => m.ts >= from).map((m) => m.concentrationMmolL);
            const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
            const avg = mean(pts);
            const min = pts.length ? Math.min(...pts) : 0;
            const max = pts.length ? Math.max(...pts) : 0;
            lines.push(
              `${range === "last_month" ? "지난달" : "최근 7일"} 젖산 요약: n=${pts.length}, avg=${avg.toFixed(2)} mmol/L, min=${min.toFixed(2)}, max=${max.toFixed(2)}.`
            );
          }
        }
      }

      const asstMsg: ChatMessage = {
        id: `a-${Date.now() + 1}`,
        role: "assistant",
        ts: Date.now() + 1,
        text: lines.join(" "),
        fromVoice,
        personaId: personaId ?? "secretary" // Tool calls are secretary-like
      };
      setChat((prev) => [...prev, userMsg, asstMsg]);
      return;
    }

    // Build extended context for multi-persona system
    const multiCtx: MultiPersonaContext = {
      ...chatContext,
      glucoseLevel: 100 + Math.random() * 40, // Mock glucose
      ketoneLevel: 0.1 + Math.random() * 0.3, // Mock ketone
      cortisolLevel: 10 + Math.random() * 15, // Mock cortisol
      sleepScore: 60 + Math.random() * 30, // Mock sleep
      upcomingAppointments: appointments.filter(a => a.status === "scheduled").length,
      pendingMedReminders: 0 // TODO: integrate with med ledger
    };

    // Use persona-specific response if persona is provided
    const effectivePersona = personaId ?? "doctor";
    const { text: personaText } = generatePersonaResponse(effectivePersona, text, multiCtx, "ko");
    
    let responseText = personaText;
    
    // Apply adaptive coaching enhancement if applicable
    const isRestAdvice = responseText.includes("휴식") || responseText.includes("쉬") || responseText.includes("rest");
    if (isRestAdvice) {
      responseText = adaptiveCoaching.enhanceResponse(responseText, "rest");
    }
    
    const asstMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      ts: Date.now() + 1,
      text: responseText,
      fromVoice,
      personaId: effectivePersona
    };
    
    setChat((prev) => [...prev, userMsg, asstMsg]);
    setCoachingPersonality(adaptiveCoaching.getPersonality());
  }, [chatContext, measurements, appointments, setRafeTargetAnalyte]);

  const handleFeedback = useCallback((messageId: string, feedbackType: "positive" | "negative") => {
    setChat(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback: feedbackType } : m
    ));
    
    adaptiveCoaching.recordUserResponse(feedbackType === "positive", feedbackType);
    setCoachingPersonality(adaptiveCoaching.getPersonality());
  }, []);

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments(prev => [...prev, appointment]);
  }, []);

  const refreshAppointments = useCallback(() => {
    setAppointments(appointmentManager.getAll());
  }, []);

  const addPrescription = useCallback((prescription: Prescription) => {
    setPrescriptions(prev => [...prev, prescription]);
  }, []);

  const clearLogs = useCallback(() => {
    setSensorLogs([]);
  }, []);

  const addLog = useCallback((log: SensorLog) => {
    setSensorLogs(prev => [...prev.slice(-29), log]);
  }, []);

  /* ---- Context Value ---- */
  const coachingPersonalityGoalTuned = useMemo<CoachingPersonality>(() => {
    // Goal-driven tuning:
    // - stress_management: favor gentle unless score is very low
    // - blood_sugar_control: favor serious when score is low
    // - muscle_gain: keep balanced (avoid overcorrection)
    if (goals.includes("stress_management") && healthScore >= 60) return "gentle";
    if (goals.includes("blood_sugar_control") && healthScore < 60) return "serious";
    return coachingPersonality;
  }, [goals, healthScore, coachingPersonality]);

  const value: UserContextType = {
    // State
    measurements,
    healthScore,
    latestConcentration,
    trend7,
    activeCartridge,
    activeCalibration,
    chat,
    chatContext,
    coachingPersonality: coachingPersonalityGoalTuned,
    goals,
    appointments,
    prescriptions,
    sensorLogs,
    isMeasuring,
    lastSafetyTelemetry,
    failSafeLock,
    hydrogelDetection,
    solidModeOverlayOpen,
    lastSolidSampleImpedanceOhm,
    
    // Computed
    hasLowHealthScore,
    upcomingAppointmentsCount,
    activePrescriptionsCount,
    cartridgeLibraryCount,
    dailyInsight,
    
    // Mall
    mallHealthContext,
    cartItemCount,
    refreshCart,

    // SDMS / RAFE
    rafeSelectedAnalyte,
    setRafeTargetAnalyte,

    // Sensor Life / Digital Twin
    sampleType,
    setSampleType,
    
    // Actions
    handleMeasure,
    confirmSolidHoldAndMeasure,
    dismissSolidModeOverlay,
    beginSolidHoldFreeze,
    clearFailSafeLock,
    handleCartridgeAuthenticated,
    handleCartridgeRejected,
    handleSendMessage,
    handleFeedback,
    addAppointment,
    refreshAppointments,
    addPrescription,
    clearLogs,
    addLog,
    refreshProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

/* ============================================
 * Hook
 * ============================================
 */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export default UserContext;

