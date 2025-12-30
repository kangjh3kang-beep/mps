/**
 * EHD (Electrohydrodynamic) Active Air Suction System Driver
 *
 * Patent-referenced SD control:
 * - High Voltage range: 0V -> 3.5kV
 * - PID control loop: adjustVoltage(targetFlowRate, currentFlow)
 * - Safety lock: if humidity > 90%, auto-shutdown to prevent arcing / ozone (protection logic)
 *
 * This is a simulation driver (no real hardware IO).
 */

export type EHDSuctionLevel = "low" | "med" | "high";

export type EHDFault = "NONE" | "HIGH_HUMIDITY_SHUTDOWN";

export type EHDEventType =
  | "PID_STEP"
  | "SAFETY_SHUTDOWN"
  | "FAULT_RESET"
  | "LEVEL_CHANGED"
  | "HUMIDITY_CHANGED"
  | "ENABLED_CHANGED"
  | "AUTO_LEVEL_APPLIED";

export type EHDControlSource = "manual" | "auto";

export interface EHDEvent {
  ts: number;
  type: EHDEventType;
  message: string;
  payload?: Record<string, unknown>;
}

export interface EHDConfig {
  /** Max HV output in volts */
  maxVoltageV: number; // 3500
  /** PID tuning */
  kp: number;
  ki: number;
  kd: number;
  /** Integrator clamp to avoid windup */
  integratorClamp: number;
  /** Voltage slew per step clamp (V/step) */
  maxDeltaVPerStep: number;
  /** Flow model: flowApproachRate (0..1) per step */
  flowAlpha: number;
  /** Flow model: flow-per-volt gain (arbitrary units; we use L/min-like) */
  flowGain: number;
  /** Noise amplitude added to flow */
  flowNoise: number;
  /** Humidity threshold for safety shutdown (%) */
  humidityShutdownThreshold: number; // 90
}

export interface EHDState {
  enabled: boolean;
  fault: EHDFault;
  suctionLevel: EHDSuctionLevel;
  /** If true, SD policy may adjust suction automatically (e.g., gas analyte selected) */
  autoControlEnabled: boolean;
  /** Last time user manually changed suction (ms epoch). Used to avoid fighting user. */
  lastManualOverrideAt: number | null;

  /** Inputs */
  humidityPct: number;
  targetFlowRate: number; // arbitrary units (e.g., L/min)

  /** Outputs */
  voltageV: number;
  currentFlowRate: number;

  /** Internals */
  pid: {
    error: number;
    integral: number;
    derivative: number;
    lastError: number;
  };

  lastUpdatedAt: number;
}

export interface EHDStepResult {
  state: EHDState;
  didShutdown: boolean;
  logLines: string[];
}

const DEFAULT_CONFIG: EHDConfig = {
  maxVoltageV: 3500,
  kp: 280,
  ki: 18,
  kd: 90,
  integratorClamp: 250,
  maxDeltaVPerStep: 250,
  flowAlpha: 0.18,
  flowGain: 0.0022, // flow ≈ V * gain
  flowNoise: 0.04,
  humidityShutdownThreshold: 90
};

const LEVEL_TARGET_FLOW: Record<EHDSuctionLevel, number> = {
  low: 2.0,
  med: 4.0,
  high: 6.5
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class EHDDriver {
  private config: EHDConfig;
  private state: EHDState;
  private listeners: Set<(s: EHDState) => void> = new Set();
  private eventListeners: Set<(e: EHDEvent) => void> = new Set();
  private eventLog: EHDEvent[] = [];

  constructor(config: Partial<EHDConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  private createInitialState(): EHDState {
    return {
      enabled: true,
      fault: "NONE",
      suctionLevel: "low",
      autoControlEnabled: true,
      lastManualOverrideAt: null,
      humidityPct: 45,
      targetFlowRate: LEVEL_TARGET_FLOW.low,
      voltageV: 900,
      currentFlowRate: 1.5,
      pid: { error: 0, integral: 0, derivative: 0, lastError: 0 },
      lastUpdatedAt: Date.now()
    };
  }

  getState(): EHDState {
    return { ...this.state, pid: { ...this.state.pid } };
  }

  subscribe(listener: (s: EHDState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeEvents(listener: (e: EHDEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach((l) => l(snapshot));
  }

  private emit(event: EHDEvent) {
    this.eventLog.push(event);
    // cap log size
    if (this.eventLog.length > 200) this.eventLog = this.eventLog.slice(-200);
    this.eventListeners.forEach((l) => l(event));
  }

  getEventLog(): EHDEvent[] {
    return [...this.eventLog];
  }

  clearEventLog() {
    this.eventLog = [];
  }

  setHumidity(humidityPct: number) {
    this.state.humidityPct = clamp(humidityPct, 0, 100);
    this.state.lastUpdatedAt = Date.now();
    this.emit({
      ts: this.state.lastUpdatedAt,
      type: "HUMIDITY_CHANGED",
      message: `Humidity set to ${this.state.humidityPct.toFixed(0)}%`,
      payload: { humidityPct: this.state.humidityPct }
    });
    // If humidity is already too high, enforce safety immediately
    if (this.state.humidityPct > this.config.humidityShutdownThreshold) {
      this.shutdownForSafety();
    }
    this.notify();
  }

  setSuctionLevel(level: EHDSuctionLevel, source: EHDControlSource = "manual") {
    this.state.suctionLevel = level;
    this.state.targetFlowRate = LEVEL_TARGET_FLOW[level];
    if (source === "manual") this.state.lastManualOverrideAt = Date.now();
    this.state.lastUpdatedAt = Date.now();
    this.emit({
      ts: this.state.lastUpdatedAt,
      type: source === "manual" ? "LEVEL_CHANGED" : "AUTO_LEVEL_APPLIED",
      message: `${source === "manual" ? "Manual" : "Auto"} suction level → ${level.toUpperCase()}`,
      payload: { level, source, targetFlowRate: this.state.targetFlowRate }
    });
    this.notify();
  }

  setAutoControlEnabled(enabled: boolean) {
    this.state.autoControlEnabled = enabled;
    this.state.lastUpdatedAt = Date.now();
    this.emit({
      ts: this.state.lastUpdatedAt,
      type: "ENABLED_CHANGED",
      message: `Auto control ${enabled ? "enabled" : "disabled"}`,
      payload: { autoControlEnabled: enabled }
    });
    this.notify();
  }

  setEnabled(enabled: boolean) {
    this.state.enabled = enabled;
    if (!enabled) {
      this.state.voltageV = 0;
      this.state.pid.integral = 0;
      this.state.pid.lastError = 0;
    } else if (this.state.fault !== "NONE") {
      // do not auto-enable if faulted
      this.state.enabled = false;
    }
    this.state.lastUpdatedAt = Date.now();
    this.emit({
      ts: this.state.lastUpdatedAt,
      type: "ENABLED_CHANGED",
      message: `EHD ${this.state.enabled ? "enabled" : "disabled"}`,
      payload: { enabled: this.state.enabled }
    });
    this.notify();
  }

  resetFault() {
    this.state.fault = "NONE";
    this.state.enabled = true;
    this.state.lastUpdatedAt = Date.now();
    this.emit({
      ts: this.state.lastUpdatedAt,
      type: "FAULT_RESET",
      message: "Fault reset. EHD re-enabled."
    });
    this.notify();
  }

  private shutdownForSafety() {
    this.state.fault = "HIGH_HUMIDITY_SHUTDOWN";
    this.state.enabled = false;
    this.state.voltageV = 0;
    this.state.pid.integral = 0;
    this.state.pid.lastError = 0;
    this.emit({
      ts: Date.now(),
      type: "SAFETY_SHUTDOWN",
      message: `AUTO SHUTDOWN: humidity ${this.state.humidityPct.toFixed(1)}% > ${this.config.humidityShutdownThreshold}%`,
      payload: { humidityPct: this.state.humidityPct }
    });
  }

  /**
   * PID adjustment (simulation): returns new voltage setpoint
   * - Increasing targetFlowRate increases voltage
   * - Voltage clamped 0..3.5kV
   * - Safety shutdown on humidity > 90%
   */
  adjustVoltage(targetFlowRate: number, currentFlow: number, humidityPct: number): { voltageV: number; didShutdown: boolean; logLines: string[] } {
    const logLines: string[] = [];
    const humidity = clamp(humidityPct, 0, 100);

    // Safety lock
    if (humidity > this.config.humidityShutdownThreshold) {
      logLines.push(`[EHD][SAFETY] Humidity ${humidity.toFixed(1)}% > ${this.config.humidityShutdownThreshold}% → AUTO SHUTDOWN (Ozone/Arcing protection)`);
      return { voltageV: 0, didShutdown: true, logLines };
    }

    const error = targetFlowRate - currentFlow;
    const integral = clamp(this.state.pid.integral + error, -this.config.integratorClamp, this.config.integratorClamp);
    const derivative = error - this.state.pid.lastError;

    const control = this.config.kp * error + this.config.ki * integral + this.config.kd * derivative;

    const desiredVoltage = clamp(this.state.voltageV + control, 0, this.config.maxVoltageV);
    const delta = clamp(desiredVoltage - this.state.voltageV, -this.config.maxDeltaVPerStep, this.config.maxDeltaVPerStep);
    const nextVoltage = clamp(this.state.voltageV + delta, 0, this.config.maxVoltageV);

    logLines.push(`[EHD][PID] target=${targetFlowRate.toFixed(2)} current=${currentFlow.toFixed(2)} err=${error.toFixed(2)} → ΔV=${delta.toFixed(0)}V, V=${nextVoltage.toFixed(0)}V`);
    this.emit({
      ts: Date.now(),
      type: "PID_STEP",
      message: `PID step: target=${targetFlowRate.toFixed(2)} current=${currentFlow.toFixed(2)} → V=${nextVoltage.toFixed(0)}V`,
      payload: { targetFlowRate, currentFlow, error, voltageV: nextVoltage }
    });

    // Update internal PID
    this.state.pid = {
      error,
      integral,
      derivative,
      lastError: error
    };

    return { voltageV: nextVoltage, didShutdown: false, logLines };
  }

  /**
   * Step simulation forward once:
   * - Applies safety lock
   * - Runs PID to adjust voltage
   * - Updates flow model based on voltage
   */
  step(): EHDStepResult {
    const now = Date.now();
    const logLines: string[] = [];

    // If faulted, stay off until reset
    if (this.state.fault !== "NONE") {
      this.state.voltageV = 0;
      this.state.lastUpdatedAt = now;
      this.notify();
      return { state: this.getState(), didShutdown: false, logLines: [`[EHD] Fault=${this.state.fault} → output disabled`] };
    }

    // If disabled, decay flow toward 0
    if (!this.state.enabled) {
      this.state.voltageV = 0;
      this.state.currentFlowRate = Math.max(0, this.state.currentFlowRate * (1 - this.config.flowAlpha));
      this.state.lastUpdatedAt = now;
      this.notify();
      return { state: this.getState(), didShutdown: false, logLines: [`[EHD] Disabled → V=0V`] };
    }

    const { voltageV, didShutdown, logLines: pidLines } = this.adjustVoltage(
      this.state.targetFlowRate,
      this.state.currentFlowRate,
      this.state.humidityPct
    );
    logLines.push(...pidLines);

    if (didShutdown) {
      this.shutdownForSafety();
      this.state.lastUpdatedAt = now;
      this.notify();
      return { state: this.getState(), didShutdown: true, logLines };
    }

    this.state.voltageV = voltageV;

    // Flow model: approach k*V with some noise and first-order lag
    const idealFlow = this.state.voltageV * this.config.flowGain;
    const noise = (Math.random() - 0.5) * 2 * this.config.flowNoise;
    const nextFlow = this.state.currentFlowRate + (idealFlow - this.state.currentFlowRate) * this.config.flowAlpha + noise;
    this.state.currentFlowRate = Math.max(0, nextFlow);

    this.state.lastUpdatedAt = now;
    this.notify();
    return { state: this.getState(), didShutdown: false, logLines };
  }
}

/* ============================================
 * Singleton + React Hook
 * ============================================ */

let ehdInstance: EHDDriver | null = null;

export function getEHDDriver(): EHDDriver {
  if (!ehdInstance) ehdInstance = new EHDDriver();
  return ehdInstance;
}

import { useCallback, useEffect, useMemo, useState } from "react";

export function useEHD() {
  const driver = useMemo(() => getEHDDriver(), []);
  const [state, setState] = useState<EHDState>(driver.getState());
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => driver.subscribe(setState), [driver]);

  // Run simulation loop
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      driver.step();
    }, 250);
    return () => window.clearInterval(id);
  }, [driver, isRunning]);

  const setSuctionLevel = useCallback((level: EHDSuctionLevel) => driver.setSuctionLevel(level, "manual"), [driver]);
  const applyAutoSuctionLevel = useCallback((level: EHDSuctionLevel) => driver.setSuctionLevel(level, "auto"), [driver]);
  const setHumidity = useCallback((humidityPct: number) => driver.setHumidity(humidityPct), [driver]);
  const setEnabled = useCallback((enabled: boolean) => driver.setEnabled(enabled), [driver]);
  const resetFault = useCallback(() => driver.resetFault(), [driver]);
  const setAutoControlEnabled = useCallback((enabled: boolean) => driver.setAutoControlEnabled(enabled), [driver]);

  const ionicWindSpeed = useMemo(() => {
    // Convert flow to a UI-friendly 0..1 scale
    const maxFlow = LEVEL_TARGET_FLOW.high;
    return clamp(state.currentFlowRate / maxFlow, 0, 1);
  }, [state.currentFlowRate]);

  const voltageKV = useMemo(() => state.voltageV / 1000, [state.voltageV]);

  return {
    state,
    isRunning,
    setIsRunning,
    setSuctionLevel,
    applyAutoSuctionLevel,
    setHumidity,
    setEnabled,
    resetFault,
    setAutoControlEnabled,
    ionicWindSpeed,
    voltageKV
  };
}


