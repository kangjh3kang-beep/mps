/**
 * RAFE (Reconfigurable Analog Front-End) Controller
 * 
 * Software Defined Measurement System (SDMS)
 * Based on Patent Specification for Multi-Modal Biosensing
 * 
 * The RAFE chip allows dynamic reconfiguration of:
 * - Input impedance
 * - Amplifier topology
 * - Switch matrix routing
 * - Frequency response
 */

/* ============================================
 * Types & Interfaces
 * ============================================ */

/**
 * RAFE Operating Modes
 */
export type RAFEMode = 
  | "MODE_LIQUID_EC"      // Potentiostat for electrochemical sensing
  | "MODE_GAS_HIGH_Z"     // High impedance for gas sensing
  | "MODE_BIO_IMPEDANCE"  // AC impedance spectroscopy
  | "MODE_IDLE";          // Low power standby

/**
 * Target Analyte Categories
 */
export type AnalyteCategory = 
  | "liquid"    // Glucose, Lactate, pH, etc.
  | "gas"       // Radon, VOCs, CO2, etc.
  | "bio"       // Virus, Bacteria, Cells
  | "none";

/**
 * Individual Switch State
 */
export type SwitchState = "OPEN" | "CLOSED";

/**
 * Switch Matrix Configuration
 */
export interface SwitchMatrix {
  SW1_WE_CONNECT: SwitchState;      // Working Electrode connection
  SW2_RE_CONNECT: SwitchState;      // Reference Electrode connection
  SW3_CE_CONNECT: SwitchState;      // Counter Electrode connection
  SW4_GUARD_ENABLE: SwitchState;    // Guard ring activation
  SW5_HIGH_Z_MODE: SwitchState;     // High impedance input mode
  SW6_TIA_BYPASS: SwitchState;      // Transimpedance amp bypass
  SW7_AC_COUPLING: SwitchState;     // AC coupling capacitor
  SW8_FREQ_GEN: SwitchState;        // Frequency generator connection
}

/**
 * Pin Configuration
 */
export interface PinConfig {
  pin: number;
  name: string;
  function: string;
  isActive: boolean;
  voltage?: number;
  current?: number;
}

/**
 * RAFE Configuration State
 */
export interface RAFEState {
  mode: RAFEMode;
  /** Supported analytes in the current mode (preset capability list) */
  targetAnalytes: string[];
  /** Currently selected target analyte driving the configuration (SDMS) */
  selectedAnalyte: string | null;
  category: AnalyteCategory;
  inputImpedance: string;        // e.g., "1MΩ", ">10TΩ"
  frequency: string;             // e.g., "DC", "10Hz-100kHz"
  gainSetting: number;           // Amplifier gain
  switchMatrix: SwitchMatrix;
  activePins: PinConfig[];
  isCalibrated: boolean;
  lastCalibration: number | null;
  powerConsumption: string;      // e.g., "5mW", "50µW"
}

/**
 * Mode Change Event
 */
export interface ModeChangeEvent {
  timestamp: number;
  previousMode: RAFEMode;
  newMode: RAFEMode;
  switchChanges: { switch: string; from: SwitchState; to: SwitchState }[];
  transitionTime: number;        // ms
}

/* ============================================
 * Mode Configurations
 * ============================================ */

/**
 * Default Switch Matrix (All Open - Idle State)
 */
const IDLE_SWITCH_MATRIX: SwitchMatrix = {
  SW1_WE_CONNECT: "OPEN",
  SW2_RE_CONNECT: "OPEN",
  SW3_CE_CONNECT: "OPEN",
  SW4_GUARD_ENABLE: "OPEN",
  SW5_HIGH_Z_MODE: "OPEN",
  SW6_TIA_BYPASS: "OPEN",
  SW7_AC_COUPLING: "OPEN",
  SW8_FREQ_GEN: "OPEN"
};

/**
 * Mode Configuration Presets
 */
interface ModePreset {
  mode: RAFEMode;
  name: string;
  nameKo: string;
  description: string;
  category: AnalyteCategory;
  targetAnalytes: string[];
  targetAnalytesKo: string[];
  inputImpedance: string;
  frequency: string;
  gainSetting: number;
  powerConsumption: string;
  switchMatrix: SwitchMatrix;
  activePinNumbers: number[];
  icon: string;
}

export const MODE_PRESETS: Record<RAFEMode, ModePreset> = {
  MODE_IDLE: {
    mode: "MODE_IDLE",
    name: "Idle",
    nameKo: "대기",
    description: "Low power standby mode",
    category: "none",
    targetAnalytes: [],
    targetAnalytesKo: [],
    inputImpedance: "N/A",
    frequency: "N/A",
    gainSetting: 0,
    powerConsumption: "10µW",
    switchMatrix: IDLE_SWITCH_MATRIX,
    activePinNumbers: [],
    icon: "🔌"
  },
  
  MODE_LIQUID_EC: {
    mode: "MODE_LIQUID_EC",
    name: "Liquid EC (Potentiostat)",
    nameKo: "액체 전기화학",
    description: "Amperometric/Voltammetric measurement for liquid samples",
    category: "liquid",
    targetAnalytes: ["Glucose", "Lactate", "Uric Acid", "Cholesterol", "pH"],
    targetAnalytesKo: ["포도당", "젖산", "요산", "콜레스테롤", "pH"],
    inputImpedance: "1MΩ",
    frequency: "DC - 10Hz",
    gainSetting: 100,
    powerConsumption: "5mW",
    switchMatrix: {
      SW1_WE_CONNECT: "CLOSED",
      SW2_RE_CONNECT: "CLOSED",
      SW3_CE_CONNECT: "CLOSED",
      SW4_GUARD_ENABLE: "CLOSED",
      SW5_HIGH_Z_MODE: "OPEN",
      SW6_TIA_BYPASS: "OPEN",
      SW7_AC_COUPLING: "OPEN",
      SW8_FREQ_GEN: "OPEN"
    },
    activePinNumbers: [1, 2, 3, 4],
    icon: "💧"
  },
  
  MODE_GAS_HIGH_Z: {
    mode: "MODE_GAS_HIGH_Z",
    name: "Gas Sensing (High-Z)",
    nameKo: "가스 감지 (고임피던스)",
    description: "Ultra-high impedance input for resistive gas sensors",
    category: "gas",
    targetAnalytes: ["Radon", "VOCs", "CO2", "Ammonia", "H2S"],
    targetAnalytesKo: ["라돈", "휘발성유기화합물", "이산화탄소", "암모니아", "황화수소"],
    inputImpedance: ">10TΩ",
    frequency: "0.1Hz - 1Hz",
    gainSetting: 1000,
    powerConsumption: "500µW",
    switchMatrix: {
      SW1_WE_CONNECT: "CLOSED",
      SW2_RE_CONNECT: "OPEN",
      SW3_CE_CONNECT: "OPEN",
      SW4_GUARD_ENABLE: "CLOSED",
      SW5_HIGH_Z_MODE: "CLOSED",
      SW6_TIA_BYPASS: "CLOSED",
      SW7_AC_COUPLING: "OPEN",
      SW8_FREQ_GEN: "OPEN"
    },
    activePinNumbers: [1, 5, 6],
    icon: "💨"
  },
  
  MODE_BIO_IMPEDANCE: {
    mode: "MODE_BIO_IMPEDANCE",
    name: "Bio-Impedance (AC Sweep)",
    nameKo: "바이오 임피던스",
    description: "AC frequency sweep for biological impedance spectroscopy",
    category: "bio",
    targetAnalytes: ["Virus", "Bacteria", "Cell Count", "DNA", "Protein"],
    targetAnalytesKo: ["바이러스", "세균", "세포 수", "DNA", "단백질"],
    inputImpedance: "100kΩ - 10MΩ",
    frequency: "10Hz - 100kHz",
    gainSetting: 10,
    powerConsumption: "15mW",
    switchMatrix: {
      SW1_WE_CONNECT: "CLOSED",
      SW2_RE_CONNECT: "CLOSED",
      SW3_CE_CONNECT: "CLOSED",
      SW4_GUARD_ENABLE: "OPEN",
      SW5_HIGH_Z_MODE: "OPEN",
      SW6_TIA_BYPASS: "OPEN",
      SW7_AC_COUPLING: "CLOSED",
      SW8_FREQ_GEN: "CLOSED"
    },
    activePinNumbers: [1, 2, 3, 7, 8],
    icon: "🦠"
  }
};

/* ============================================
 * Pin Definitions
 * ============================================ */

export const PIN_DEFINITIONS: PinConfig[] = [
  { pin: 1, name: "WE", function: "Working Electrode", isActive: false },
  { pin: 2, name: "RE", function: "Reference Electrode", isActive: false },
  { pin: 3, name: "CE", function: "Counter Electrode", isActive: false },
  { pin: 4, name: "GND", function: "Ground/Shield", isActive: false },
  { pin: 5, name: "HZ_IN", function: "High-Z Input", isActive: false },
  { pin: 6, name: "GUARD", function: "Guard Ring", isActive: false },
  { pin: 7, name: "AC_P", function: "AC Drive (+)", isActive: false },
  { pin: 8, name: "AC_N", function: "AC Drive (-)", isActive: false }
];

/* ============================================
 * RAFE Controller Class
 * ============================================ */

export class RAFEController {
  private state: RAFEState;
  private eventLog: ModeChangeEvent[] = [];
  private listeners: Set<(state: RAFEState) => void> = new Set();
  private modeLock: { locked: boolean; owner: string | null; reason: string | null; lockedAt: number | null } = {
    locked: false,
    owner: null,
    reason: null,
    lockedAt: null
  };
  
  constructor() {
    this.state = this.createInitialState();
  }

  /**
   * Freeze / lock mode switching for a critical window (e.g., solid hydrogel hold stabilization).
   * While locked, `setMode` / `selectTargetAnalyte` from other owners will be ignored.
   */
  lockMode(owner: string, reason: string) {
    this.modeLock = { locked: true, owner, reason, lockedAt: Date.now() };
    console.warn(`[RAFE][LOCK] Mode switching locked by "${owner}": ${reason}`);
    // Trigger UI refresh (lock state is UI-visible)
    this.notifyListeners();
  }

  unlockMode(owner: string) {
    if (!this.modeLock.locked) return;
    if (this.modeLock.owner && this.modeLock.owner !== owner) {
      console.warn(`[RAFE][LOCK] Unlock ignored. Current owner="${this.modeLock.owner}", attempted by="${owner}"`);
      return;
    }
    console.warn(`[RAFE][LOCK] Mode switching unlocked by "${owner}"`);
    this.modeLock = { locked: false, owner: null, reason: null, lockedAt: null };
    // Trigger UI refresh (lock state is UI-visible)
    this.notifyListeners();
  }

  getLockState() {
    return { ...this.modeLock };
  }
  
  /**
   * Create initial idle state
   */
  private createInitialState(): RAFEState {
    const preset = MODE_PRESETS.MODE_IDLE;
    return {
      mode: preset.mode,
      targetAnalytes: preset.targetAnalytes,
      selectedAnalyte: null,
      category: preset.category,
      inputImpedance: preset.inputImpedance,
      frequency: preset.frequency,
      gainSetting: preset.gainSetting,
      switchMatrix: { ...preset.switchMatrix },
      activePins: this.buildActivePins(preset.activePinNumbers),
      isCalibrated: false,
      lastCalibration: null,
      powerConsumption: preset.powerConsumption
    };
  }
  
  /**
   * Build active pins array from pin numbers
   */
  private buildActivePins(activePinNumbers: number[]): PinConfig[] {
    return PIN_DEFINITIONS.map(pin => ({
      ...pin,
      isActive: activePinNumbers.includes(pin.pin)
    }));
  }
  
  /**
   * Get current state
   */
  getState(): RAFEState {
    return { ...this.state };
  }
  
  /**
   * Get mode preset info
   */
  getModePreset(mode: RAFEMode): ModePreset {
    return MODE_PRESETS[mode];
  }
  
  /**
   * Get all available modes
   */
  getAvailableModes(): ModePreset[] {
    return Object.values(MODE_PRESETS);
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: RAFEState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
  
  /**
   * Set RAFE mode with switch matrix reconfiguration
   */
  async setMode(newMode: RAFEMode): Promise<ModeChangeEvent> {
    if (this.modeLock.locked) {
      console.warn(
        `[RAFE] Mode change blocked by lock (owner="${this.modeLock.owner ?? "unknown"}", reason="${this.modeLock.reason ?? ""}")`
      );
      return {
        timestamp: Date.now(),
        previousMode: this.state.mode,
        newMode: this.state.mode,
        switchChanges: [],
        transitionTime: 0
      };
    }

    const previousMode = this.state.mode;
    const previousMatrix = { ...this.state.switchMatrix };
    const preset = MODE_PRESETS[newMode];
    
    // Calculate switch changes
    const switchChanges: ModeChangeEvent["switchChanges"] = [];
    for (const [key, newValue] of Object.entries(preset.switchMatrix) as [keyof SwitchMatrix, SwitchState][]) {
      const oldValue = previousMatrix[key];
      if (oldValue !== newValue) {
        switchChanges.push({
          switch: key,
          from: oldValue,
          to: newValue
        });
      }
    }
    
    // Log virtual switch matrix changes
    console.log(`[RAFE] Mode transition: ${previousMode} → ${newMode}`);
    console.log("[RAFE] Virtual Switch Matrix reconfiguration:");
    switchChanges.forEach(change => {
      console.log(`  ${change.switch}: ${change.from} → ${change.to}`);
    });
    
    // Simulate transition time (depends on number of switches)
    const transitionTime = 10 + switchChanges.length * 5; // ms
    await new Promise(resolve => setTimeout(resolve, transitionTime));
    
    // Update state
    this.state = {
      mode: preset.mode,
      targetAnalytes: preset.targetAnalytes,
      // keep previously selected analyte if still compatible; otherwise clear
      selectedAnalyte:
        this.state.selectedAnalyte && preset.targetAnalytes.includes(this.state.selectedAnalyte)
          ? this.state.selectedAnalyte
          : null,
      category: preset.category,
      inputImpedance: preset.inputImpedance,
      frequency: preset.frequency,
      gainSetting: preset.gainSetting,
      switchMatrix: { ...preset.switchMatrix },
      activePins: this.buildActivePins(preset.activePinNumbers),
      isCalibrated: false,
      lastCalibration: null,
      powerConsumption: preset.powerConsumption
    };
    
    // Create event
    const event: ModeChangeEvent = {
      timestamp: Date.now(),
      previousMode,
      newMode,
      switchChanges,
      transitionTime
    };
    
    this.eventLog.push(event);
    this.notifyListeners();
    
    console.log(`[RAFE] Mode change complete. Transition time: ${transitionTime}ms`);
    
    return event;
  }

  /* ============================================
   * SDMS: Target Analyte → Mode State Machine
   * ============================================ */

  /**
   * Map a target analyte to the required RAFE mode.
   * This is the SDMS decision layer described in the RAFE patent spec.
   */
  static getRequiredModeForAnalyte(analyte: string): RAFEMode {
    const a = analyte.trim().toLowerCase();
    if (a === "glucose" || a === "lactate") return "MODE_LIQUID_EC";
    if (a === "radon" || a === "vocs") return "MODE_GAS_HIGH_Z";
    if (a === "virus" || a === "bacteria") return "MODE_BIO_IMPEDANCE";
    // fallback: infer by searching presets
    for (const preset of Object.values(MODE_PRESETS)) {
      if (preset.targetAnalytes.some((x) => x.toLowerCase() === a)) return preset.mode;
    }
    return "MODE_IDLE";
  }

  /**
   * Select a target analyte and automatically reconfigure the virtual switch matrix.
   * Logs the switch changes (SWx: OPEN/CLOSED) and updates `selectedAnalyte`.
   */
  async selectTargetAnalyte(analyte: string): Promise<{ analyte: string; mode: RAFEMode; event?: ModeChangeEvent }> {
    if (this.modeLock.locked) {
      console.warn(
        `[RAFE][SDMS] Target analyte selection blocked by lock (owner="${this.modeLock.owner ?? "unknown"}", reason="${this.modeLock.reason ?? ""}")`
      );
      return {
        analyte: this.state.selectedAnalyte ?? analyte.trim(),
        mode: this.state.mode
      };
    }

    const requiredMode = RAFEController.getRequiredModeForAnalyte(analyte);
    const normalized =
      // prefer canonical preset casing if present
      Object.values(MODE_PRESETS)
        .flatMap((p) => p.targetAnalytes)
        .find((x) => x.toLowerCase() === analyte.trim().toLowerCase()) ?? analyte.trim();

    // If switching modes is required, do it (this logs the virtual switch matrix)
    let event: ModeChangeEvent | undefined;
    if (this.state.mode !== requiredMode) {
      event = await this.setMode(requiredMode);
    }

    // Update selected analyte and notify listeners
    this.state = {
      ...this.state,
      selectedAnalyte: normalized
    };
    console.log(`[RAFE][SDMS] Target analyte selected: ${normalized} → ${requiredMode}`);
    this.notifyListeners();

    return { analyte: normalized, mode: requiredMode, event };
  }
  
  /**
   * Run calibration for current mode
   */
  async runCalibration(): Promise<boolean> {
    console.log(`[RAFE] Starting calibration for mode: ${this.state.mode}`);
    
    // Simulate calibration process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.state.isCalibrated = true;
    this.state.lastCalibration = Date.now();
    
    console.log("[RAFE] Calibration complete");
    this.notifyListeners();
    
    return true;
  }
  
  /**
   * Get event log
   */
  getEventLog(): ModeChangeEvent[] {
    return [...this.eventLog];
  }
  
  /**
   * Clear event log
   */
  clearEventLog(): void {
    this.eventLog = [];
  }
  
  /**
   * Get switch matrix as formatted log string
   */
  getSwitchMatrixLog(): string[] {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(this.state.switchMatrix)) {
      const status = value === "CLOSED" ? "🟢" : "⚫";
      lines.push(`${status} ${key}: ${value}`);
    }
    return lines;
  }
  
  /**
   * Simulate sensor reading based on current mode
   */
  simulateMeasurement(): {
    value: number;
    unit: string;
    quality: "good" | "fair" | "poor";
    rawSignal: number[];
  } {
    const mode = this.state.mode;
    
    let value: number;
    let unit: string;
    let rawSignal: number[];
    
    switch (mode) {
      case "MODE_LIQUID_EC":
        value = 80 + Math.random() * 40; // mg/dL for glucose
        unit = "mg/dL";
        rawSignal = Array.from({ length: 50 }, () => 0.3 + Math.random() * 0.1);
        break;
        
      case "MODE_GAS_HIGH_Z":
        value = 0.5 + Math.random() * 4; // pCi/L for radon
        unit = "pCi/L";
        rawSignal = Array.from({ length: 50 }, (_, i) => 0.1 + Math.random() * 0.05 + Math.sin(i / 10) * 0.02);
        break;
        
      case "MODE_BIO_IMPEDANCE":
        value = 500 + Math.random() * 500; // Ω for impedance
        unit = "Ω";
        rawSignal = Array.from({ length: 50 }, (_, i) => 
          1000 * Math.exp(-i / 20) + 200 + Math.random() * 50
        );
        break;
        
      default:
        value = 0;
        unit = "";
        rawSignal = [];
    }
    
    const quality = this.state.isCalibrated ? "good" : Math.random() > 0.5 ? "fair" : "poor";
    
    return { value, unit, quality, rawSignal };
  }
}

/* ============================================
 * Singleton Instance
 * ============================================ */

let controllerInstance: RAFEController | null = null;

export function getRAFEController(): RAFEController {
  if (!controllerInstance) {
    controllerInstance = new RAFEController();
  }
  return controllerInstance;
}

/* ============================================
 * React Hook for RAFE Controller
 * ============================================ */

import { useState, useEffect, useCallback } from "react";

export function useRAFE() {
  const controller = getRAFEController();
  const [state, setState] = useState<RAFEState>(controller.getState());
  const [lockState, setLockState] = useState(controller.getLockState());
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    const unsubscribe = controller.subscribe((s) => {
      setState(s);
      setLockState(controller.getLockState());
    });
    return unsubscribe;
  }, [controller]);
  
  const setMode = useCallback(async (mode: RAFEMode) => {
    setIsTransitioning(true);
    try {
      await controller.setMode(mode);
    } finally {
      setIsTransitioning(false);
    }
  }, [controller]);
  
  const runCalibration = useCallback(async () => {
    return controller.runCalibration();
  }, [controller]);
  
  const getModePreset = useCallback((mode: RAFEMode) => {
    return controller.getModePreset(mode);
  }, [controller]);
  
  const simulateMeasurement = useCallback(() => {
    return controller.simulateMeasurement();
  }, [controller]);

  const selectTargetAnalyte = useCallback(async (analyte: string) => {
    setIsTransitioning(true);
    try {
      await controller.selectTargetAnalyte(analyte);
    } finally {
      setIsTransitioning(false);
    }
  }, [controller]);
  
  return {
    state,
    lockState,
    isTransitioning,
    setMode,
    selectTargetAnalyte,
    runCalibration,
    getModePreset,
    simulateMeasurement,
    getAvailableModes: () => controller.getAvailableModes(),
    getSwitchMatrixLog: () => controller.getSwitchMatrixLog()
  };
}
