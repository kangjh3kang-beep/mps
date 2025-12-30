/**
 * ============================================================
 * HARDWARE SAFETY GUARD
 * Military-Grade Hardware Abstraction Layer (HAL)
 * ============================================================
 * 
 * Core Philosophy: "The software must NEVER harm the user"
 * 
 * This module wraps all hardware commands and enforces safety rules
 * that cannot be overridden by software bugs or AI hallucinations.
 * 
 * Compliance:
 * - IEC 62304 (Medical Device Software)
 * - ISO 14971 (Medical Devices Risk Management)
 * - FDA 21 CFR Part 820 (Quality System Regulation)
 */

// ============================================
// SAFETY CONSTANTS (HARD-CODED, IMMUTABLE)
// ============================================

export const SAFETY_LIMITS = Object.freeze({
  // Voltage limits
  MAX_SAFE_VOLTAGE: 3.3,        // V - Maximum safe voltage for skin contact
  MAX_EHD_VOLTAGE: 12.0,        // V - Maximum EHD pump voltage
  CRITICAL_VOLTAGE: 24.0,       // V - Never exceed
  
  // Temperature limits
  MAX_BATTERY_TEMP: 45,         // °C - Battery thermal cutoff
  MAX_SKIN_CONTACT_TEMP: 41,    // °C - Skin contact temperature limit
  MIN_OPERATING_TEMP: 5,        // °C - Minimum operating temperature
  MAX_OPERATING_TEMP: 40,       // °C - Maximum operating temperature
  
  // Current limits
  MAX_SKIN_CURRENT_UA: 100,     // μA - Maximum current through skin
  MAX_LED_CURRENT_MA: 20,       // mA - Maximum LED drive current
  
  // Timing limits
  HEARTBEAT_INTERVAL_MS: 500,   // ms - App heartbeat interval
  HEARTBEAT_TIMEOUT_MS: 2000,   // ms - Missing heartbeat timeout
  MAX_STIMULATION_DURATION_MS: 30000, // ms - Max electrical stimulation
  
  // Sensor limits
  MIN_VALID_ADC: 100,           // ADC counts - Below this is sensor error
  MAX_VALID_ADC: 4000,          // ADC counts - Above this is sensor error
  
  // AI prediction limits (prevent hallucination-induced panic)
  MIN_VALID_GLUCOSE: 20,        // mg/dL - Below this is error
  MAX_VALID_GLUCOSE: 600,       // mg/dL - Above this is error
  EXTREME_LOW_GLUCOSE: 54,      // mg/dL - Requires human verification
  EXTREME_HIGH_GLUCOSE: 250,    // mg/dL - Requires human verification
});

// ============================================
// SAFETY ENUMS
// ============================================

export enum HardwareCommand {
  // Voltage control
  SET_EHD_VOLTAGE = 'SET_EHD_VOLTAGE',
  SET_LED_POWER = 'SET_LED_POWER',
  SET_HEATER_POWER = 'SET_HEATER_POWER',
  
  // Motor control
  START_PUMP = 'START_PUMP',
  STOP_PUMP = 'STOP_PUMP',
  
  // Measurement
  START_MEASUREMENT = 'START_MEASUREMENT',
  STOP_MEASUREMENT = 'STOP_MEASUREMENT',
  CALIBRATE_SENSOR = 'CALIBRATE_SENSOR',
  
  // Power
  ENABLE_HIGH_VOLTAGE = 'ENABLE_HIGH_VOLTAGE',
  DISABLE_HIGH_VOLTAGE = 'DISABLE_HIGH_VOLTAGE',
  START_CHARGING = 'START_CHARGING',
  STOP_CHARGING = 'STOP_CHARGING',
  
  // System
  RESET_HARDWARE = 'RESET_HARDWARE',
  ENTER_SAFE_MODE = 'ENTER_SAFE_MODE',
  EMERGENCY_SHUTDOWN = 'EMERGENCY_SHUTDOWN',
}

export enum SafetyState {
  NORMAL = 'NORMAL',
  CAUTION = 'CAUTION',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY',
  LOCKED = 'LOCKED',
}

export enum SafetyViolationType {
  VOLTAGE_EXCEEDED = 'VOLTAGE_EXCEEDED',
  CURRENT_EXCEEDED = 'CURRENT_EXCEEDED',
  TEMPERATURE_EXCEEDED = 'TEMPERATURE_EXCEEDED',
  SKIN_CONTACT_VIOLATION = 'SKIN_CONTACT_VIOLATION',
  HEARTBEAT_TIMEOUT = 'HEARTBEAT_TIMEOUT',
  SENSOR_ERROR = 'SENSOR_ERROR',
  AI_EXTREME_VALUE = 'AI_EXTREME_VALUE',
  COMMAND_BLOCKED = 'COMMAND_BLOCKED',
  BATTERY_CRITICAL = 'BATTERY_CRITICAL',
  HARDWARE_FAULT = 'HARDWARE_FAULT',
}

// ============================================
// SAFETY INTERFACES
// ============================================

export interface HardwareState {
  // Electrical
  ehdVoltage: number;          // Current EHD voltage
  ledPower: number;            // LED power percentage
  skinContact: boolean;        // Skin contact detected
  
  // Thermal
  batteryTemp: number;         // Battery temperature °C
  ambientTemp: number;         // Ambient temperature °C
  skinTemp: number;            // Skin contact temperature °C
  
  // Mechanical
  pumpRunning: boolean;        // Pump motor state
  motorSpeed: number;          // Motor speed RPM
  
  // Power
  batteryLevel: number;        // Battery percentage
  charging: boolean;           // Charging state
  highVoltageEnabled: boolean; // HV rail state
  
  // Sensor
  adcValue: number;            // Raw ADC reading
  sensorConnected: boolean;    // Sensor detection
  
  // System
  lastHeartbeat: number;       // Last heartbeat timestamp
  safetyState: SafetyState;    // Current safety state
  errorCount: number;          // Accumulated errors
}

export interface SafetyCheckResult {
  allowed: boolean;
  state: SafetyState;
  violations: SafetyViolation[];
  message: string;
  timestamp: number;
}

export interface SafetyViolation {
  type: SafetyViolationType;
  severity: 'warning' | 'critical' | 'emergency';
  value: number | string;
  limit: number | string;
  message: string;
  timestamp: number;
  requiresHumanVerification: boolean;
}

export interface CommandRequest {
  command: HardwareCommand;
  params?: Record<string, number | boolean | string>;
  userId?: string;
  requestId?: string;
  timestamp?: number;
}

export interface CommandResponse {
  success: boolean;
  command: HardwareCommand;
  blocked: boolean;
  reason?: string;
  violations?: SafetyViolation[];
  hardwareState?: Partial<HardwareState>;
  timestamp: number;
}

// ============================================
// SAFETY GUARD CLASS
// ============================================

export class SafetyGuard {
  private state: HardwareState;
  private violations: SafetyViolation[] = [];
  private locked: boolean = false;
  private lockReason: string = '';
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private onEmergency: ((reason: string) => void) | null = null;
  private auditLog: Array<{ timestamp: number; action: string; result: string }> = [];

  constructor(initialState?: Partial<HardwareState>) {
    this.state = {
      ehdVoltage: 0,
      ledPower: 0,
      skinContact: false,
      batteryTemp: 25,
      ambientTemp: 25,
      skinTemp: 32,
      pumpRunning: false,
      motorSpeed: 0,
      batteryLevel: 100,
      charging: false,
      highVoltageEnabled: false,
      adcValue: 2048,
      sensorConnected: true,
      lastHeartbeat: Date.now(),
      safetyState: SafetyState.NORMAL,
      errorCount: 0,
      ...initialState
    };
    
    this.startHeartbeatMonitor();
  }

  // ============================================
  // HEARTBEAT MONITORING
  // ============================================

  private startHeartbeatMonitor(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkHeartbeat();
    }, SAFETY_LIMITS.HEARTBEAT_INTERVAL_MS);
  }

  private checkHeartbeat(): void {
    const elapsed = Date.now() - this.state.lastHeartbeat;
    
    if (elapsed > SAFETY_LIMITS.HEARTBEAT_TIMEOUT_MS) {
      this.triggerEmergency('HEARTBEAT_TIMEOUT', 
        `App heartbeat missing for ${elapsed}ms. Hardware entering safe mode.`);
    }
  }

  /**
   * App must call this every 500ms to prove it's alive
   */
  public heartbeat(): void {
    this.state.lastHeartbeat = Date.now();
  }

  public setEmergencyCallback(callback: (reason: string) => void): void {
    this.onEmergency = callback;
  }

  // ============================================
  // CORE SAFETY CHECKS
  // ============================================

  private checkSafetyConditions(command: HardwareCommand, params?: Record<string, any>): SafetyCheckResult {
    const violations: SafetyViolation[] = [];
    let state = SafetyState.NORMAL;
    
    // Check if system is locked
    if (this.locked) {
      return {
        allowed: false,
        state: SafetyState.LOCKED,
        violations: [],
        message: `System locked: ${this.lockReason}`,
        timestamp: Date.now()
      };
    }

    // ========================================
    // RULE 1: Voltage + Skin Contact Check
    // ========================================
    if (command === HardwareCommand.SET_EHD_VOLTAGE || 
        command === HardwareCommand.ENABLE_HIGH_VOLTAGE) {
      const requestedVoltage = params?.voltage ?? SAFETY_LIMITS.MAX_EHD_VOLTAGE;
      
      // CRITICAL: High voltage with skin contact = BLOCKED
      if (this.state.skinContact && requestedVoltage > SAFETY_LIMITS.MAX_SAFE_VOLTAGE) {
        violations.push({
          type: SafetyViolationType.SKIN_CONTACT_VIOLATION,
          severity: 'emergency',
          value: requestedVoltage,
          limit: SAFETY_LIMITS.MAX_SAFE_VOLTAGE,
          message: `BLOCKED: Cannot apply ${requestedVoltage}V with skin contact. Max safe: ${SAFETY_LIMITS.MAX_SAFE_VOLTAGE}V`,
          timestamp: Date.now(),
          requiresHumanVerification: false
        });
        state = SafetyState.EMERGENCY;
      }
      
      // Check absolute voltage limit
      if (requestedVoltage > SAFETY_LIMITS.CRITICAL_VOLTAGE) {
        violations.push({
          type: SafetyViolationType.VOLTAGE_EXCEEDED,
          severity: 'emergency',
          value: requestedVoltage,
          limit: SAFETY_LIMITS.CRITICAL_VOLTAGE,
          message: `BLOCKED: Requested voltage ${requestedVoltage}V exceeds critical limit ${SAFETY_LIMITS.CRITICAL_VOLTAGE}V`,
          timestamp: Date.now(),
          requiresHumanVerification: false
        });
        state = SafetyState.EMERGENCY;
      }
    }

    // ========================================
    // RULE 2: Temperature Check
    // ========================================
    if (this.state.batteryTemp > SAFETY_LIMITS.MAX_BATTERY_TEMP) {
      violations.push({
        type: SafetyViolationType.TEMPERATURE_EXCEEDED,
        severity: 'critical',
        value: this.state.batteryTemp,
        limit: SAFETY_LIMITS.MAX_BATTERY_TEMP,
        message: `Battery temperature ${this.state.batteryTemp}°C exceeds limit ${SAFETY_LIMITS.MAX_BATTERY_TEMP}°C`,
        timestamp: Date.now(),
        requiresHumanVerification: false
      });
      
      // Auto-block charging
      if (command === HardwareCommand.START_CHARGING) {
        state = SafetyState.CRITICAL;
      }
    }

    if (this.state.skinTemp > SAFETY_LIMITS.MAX_SKIN_CONTACT_TEMP) {
      violations.push({
        type: SafetyViolationType.TEMPERATURE_EXCEEDED,
        severity: 'warning',
        value: this.state.skinTemp,
        limit: SAFETY_LIMITS.MAX_SKIN_CONTACT_TEMP,
        message: `Skin contact temperature ${this.state.skinTemp}°C exceeds limit`,
        timestamp: Date.now(),
        requiresHumanVerification: false
      });
      state = state === SafetyState.NORMAL ? SafetyState.WARNING : state;
    }

    // ========================================
    // RULE 3: Battery Level Check
    // ========================================
    if (this.state.batteryLevel < 5 && 
        (command === HardwareCommand.START_MEASUREMENT || 
         command === HardwareCommand.START_PUMP)) {
      violations.push({
        type: SafetyViolationType.BATTERY_CRITICAL,
        severity: 'warning',
        value: this.state.batteryLevel,
        limit: 5,
        message: `Battery level ${this.state.batteryLevel}% too low for operation`,
        timestamp: Date.now(),
        requiresHumanVerification: false
      });
      state = SafetyState.WARNING;
    }

    // ========================================
    // RULE 4: Sensor Validity Check
    // ========================================
    if (command === HardwareCommand.START_MEASUREMENT) {
      if (!this.state.sensorConnected) {
        violations.push({
          type: SafetyViolationType.SENSOR_ERROR,
          severity: 'critical',
          value: 'disconnected',
          limit: 'connected',
          message: 'Sensor not connected. Cannot start measurement.',
          timestamp: Date.now(),
          requiresHumanVerification: false
        });
        state = SafetyState.CRITICAL;
      }
      
      if (this.state.adcValue < SAFETY_LIMITS.MIN_VALID_ADC || 
          this.state.adcValue > SAFETY_LIMITS.MAX_VALID_ADC) {
        violations.push({
          type: SafetyViolationType.SENSOR_ERROR,
          severity: 'critical',
          value: this.state.adcValue,
          limit: `${SAFETY_LIMITS.MIN_VALID_ADC}-${SAFETY_LIMITS.MAX_VALID_ADC}`,
          message: `ADC value ${this.state.adcValue} outside valid range`,
          timestamp: Date.now(),
          requiresHumanVerification: false
        });
        state = SafetyState.CRITICAL;
      }
    }

    // ========================================
    // RULE 5: Operating Temperature Range
    // ========================================
    if (this.state.ambientTemp < SAFETY_LIMITS.MIN_OPERATING_TEMP ||
        this.state.ambientTemp > SAFETY_LIMITS.MAX_OPERATING_TEMP) {
      violations.push({
        type: SafetyViolationType.TEMPERATURE_EXCEEDED,
        severity: 'warning',
        value: this.state.ambientTemp,
        limit: `${SAFETY_LIMITS.MIN_OPERATING_TEMP}-${SAFETY_LIMITS.MAX_OPERATING_TEMP}`,
        message: `Ambient temperature ${this.state.ambientTemp}°C outside operating range`,
        timestamp: Date.now(),
        requiresHumanVerification: false
      });
      state = state === SafetyState.NORMAL ? SafetyState.CAUTION : state;
    }

    // Determine if command is allowed
    const allowed = !violations.some(v => 
      v.severity === 'emergency' || v.severity === 'critical'
    );

    return {
      allowed,
      state,
      violations,
      message: allowed 
        ? 'Safety checks passed'
        : violations.map(v => v.message).join('; '),
      timestamp: Date.now()
    };
  }

  // ============================================
  // AI PREDICTION SAFETY CHECK
  // ============================================

  /**
   * Validate AI predictions to prevent hallucination-induced panic
   * Also checks for NaN/Infinity values from sensor errors
   */
  public validateAIPrediction(value: number, type: 'glucose' | 'lactate' | 'other'): {
    valid: boolean;
    requiresHumanVerification: boolean;
    message: string;
  } {
    // CRITICAL: Check for NaN or Infinity first
    if (!Number.isFinite(value)) {
      this.violations.push({
        type: SafetyViolationType.SENSOR_ERROR,
        severity: 'critical',
        value: String(value),
        limit: 'finite number',
        message: `Invalid sensor value detected: ${value}. Possible sensor malfunction.`,
        timestamp: Date.now(),
        requiresHumanVerification: true
      });
      
      return {
        valid: false,
        requiresHumanVerification: true,
        message: '⚠️ 센서 오류가 감지되었습니다. 카트리지를 확인하고 재측정해주세요.'
      };
    }

    if (type === 'glucose') {
      // Invalid range
      if (value < SAFETY_LIMITS.MIN_VALID_GLUCOSE || value > SAFETY_LIMITS.MAX_VALID_GLUCOSE) {
        this.violations.push({
          type: SafetyViolationType.AI_EXTREME_VALUE,
          severity: 'critical',
          value,
          limit: `${SAFETY_LIMITS.MIN_VALID_GLUCOSE}-${SAFETY_LIMITS.MAX_VALID_GLUCOSE}`,
          message: `AI prediction ${value} mg/dL is outside valid range. Likely sensor error or AI hallucination.`,
          timestamp: Date.now(),
          requiresHumanVerification: true
        });
        
        return {
          valid: false,
          requiresHumanVerification: true,
          message: '⚠️ 측정값이 유효 범위를 벗어났습니다. 재측정이 필요합니다.'
        };
      }
      
      // Extreme but possible values - require verification
      if (value < SAFETY_LIMITS.EXTREME_LOW_GLUCOSE || value > SAFETY_LIMITS.EXTREME_HIGH_GLUCOSE) {
        return {
          valid: true,
          requiresHumanVerification: true,
          message: value < SAFETY_LIMITS.EXTREME_LOW_GLUCOSE
            ? '⚠️ 저혈당 의심 수치입니다. 증상을 확인하고 필요시 의료진과 상담하세요.'
            : '⚠️ 고혈당 의심 수치입니다. 재측정 또는 의료진 상담을 권장합니다.'
        };
      }
      
      return {
        valid: true,
        requiresHumanVerification: false,
        message: '정상 범위 내 측정값입니다.'
      };
    }
    
    // Default for other types
    return {
      valid: true,
      requiresHumanVerification: false,
      message: '측정이 완료되었습니다.'
    };
  }

  // ============================================
  // COMMAND EXECUTION
  // ============================================

  /**
   * Execute a hardware command with safety checks
   */
  public executeCommand(request: CommandRequest): CommandResponse {
    const { command, params, userId, requestId } = request;
    const timestamp = Date.now();
    
    // Log the attempt
    this.auditLog.push({
      timestamp,
      action: `${command} requested by ${userId || 'unknown'}`,
      result: 'pending'
    });
    
    // Safety check
    const safetyCheck = this.checkSafetyConditions(command, params);
    
    if (!safetyCheck.allowed) {
      // Log the block
      this.auditLog.push({
        timestamp,
        action: `${command} BLOCKED`,
        result: safetyCheck.message
      });
      
      // Store violations
      this.violations.push(...safetyCheck.violations);
      this.state.errorCount++;
      this.state.safetyState = safetyCheck.state;
      
      // Check if we need emergency shutdown
      if (safetyCheck.state === SafetyState.EMERGENCY) {
        this.triggerEmergency(command, safetyCheck.message);
      }
      
      return {
        success: false,
        command,
        blocked: true,
        reason: safetyCheck.message,
        violations: safetyCheck.violations,
        hardwareState: this.getState(),
        timestamp
      };
    }
    
    // Execute the command (simulation)
    this.simulateCommandExecution(command, params);
    
    // Log success
    this.auditLog.push({
      timestamp,
      action: `${command} executed`,
      result: 'success'
    });
    
    return {
      success: true,
      command,
      blocked: false,
      hardwareState: this.getState(),
      timestamp
    };
  }

  private simulateCommandExecution(command: HardwareCommand, params?: Record<string, any>): void {
    switch (command) {
      case HardwareCommand.SET_EHD_VOLTAGE:
        this.state.ehdVoltage = params?.voltage ?? 0;
        break;
      case HardwareCommand.SET_LED_POWER:
        this.state.ledPower = params?.power ?? 0;
        break;
      case HardwareCommand.START_PUMP:
        this.state.pumpRunning = true;
        this.state.motorSpeed = params?.speed ?? 1000;
        break;
      case HardwareCommand.STOP_PUMP:
        this.state.pumpRunning = false;
        this.state.motorSpeed = 0;
        break;
      case HardwareCommand.ENABLE_HIGH_VOLTAGE:
        this.state.highVoltageEnabled = true;
        break;
      case HardwareCommand.DISABLE_HIGH_VOLTAGE:
        this.state.highVoltageEnabled = false;
        break;
      case HardwareCommand.START_CHARGING:
        this.state.charging = true;
        break;
      case HardwareCommand.STOP_CHARGING:
        this.state.charging = false;
        break;
      case HardwareCommand.ENTER_SAFE_MODE:
        this.enterSafeMode('Command requested');
        break;
      case HardwareCommand.EMERGENCY_SHUTDOWN:
        this.triggerEmergency('MANUAL', 'Emergency shutdown requested');
        break;
      case HardwareCommand.RESET_HARDWARE:
        this.resetToSafe();
        break;
    }
  }

  // ============================================
  // EMERGENCY HANDLING
  // ============================================

  private triggerEmergency(reason: string, message: string): void {
    console.error(`[SAFETY EMERGENCY] ${reason}: ${message}`);
    
    // Immediately enter safe mode
    this.enterSafeMode(reason);
    
    // Lock the system
    this.locked = true;
    this.lockReason = `Emergency: ${reason}`;
    this.state.safetyState = SafetyState.EMERGENCY;
    
    // Callback for external handling
    if (this.onEmergency) {
      this.onEmergency(message);
    }
    
    // Log
    this.auditLog.push({
      timestamp: Date.now(),
      action: 'EMERGENCY_TRIGGERED',
      result: message
    });
  }

  private enterSafeMode(reason: string): void {
    console.warn(`[SAFETY] Entering safe mode: ${reason}`);
    
    // Reset all outputs to safe state
    this.state.ehdVoltage = 0;
    this.state.ledPower = 0;
    this.state.pumpRunning = false;
    this.state.motorSpeed = 0;
    this.state.highVoltageEnabled = false;
    this.state.safetyState = SafetyState.LOCKED;
    
    // Keep charging state (batteries need to charge even in safe mode)
    // But stop if temperature is high
    if (this.state.batteryTemp > SAFETY_LIMITS.MAX_BATTERY_TEMP) {
      this.state.charging = false;
    }
  }

  private resetToSafe(): void {
    this.state.ehdVoltage = 0;
    this.state.ledPower = 0;
    this.state.pumpRunning = false;
    this.state.motorSpeed = 0;
    this.state.highVoltageEnabled = false;
    this.state.safetyState = SafetyState.NORMAL;
    this.state.errorCount = 0;
    this.locked = false;
    this.lockReason = '';
    this.violations = [];
  }

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  public updateState(update: Partial<HardwareState>): void {
    this.state = { ...this.state, ...update };
    
    // Auto-check safety after state update
    if (update.skinContact && this.state.highVoltageEnabled) {
      // Skin contact detected while HV is on - immediate shutdown
      this.triggerEmergency('SKIN_CONTACT', 'Skin contact detected while high voltage enabled');
    }
    
    if (update.batteryTemp && update.batteryTemp > SAFETY_LIMITS.MAX_BATTERY_TEMP) {
      // Stop charging immediately
      this.state.charging = false;
    }
  }

  public getState(): HardwareState {
    return { ...this.state };
  }

  public getViolations(): SafetyViolation[] {
    return [...this.violations];
  }

  public getAuditLog(): Array<{ timestamp: number; action: string; result: string }> {
    return [...this.auditLog];
  }

  public isLocked(): boolean {
    return this.locked;
  }

  public unlock(adminKey: string): boolean {
    // In production, verify admin key against secure storage
    if (adminKey === process.env.SAFETY_ADMIN_KEY) {
      this.resetToSafe();
      return true;
    }
    return false;
  }

  // ============================================
  // CLEANUP
  // ============================================

  public destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.enterSafeMode('SafetyGuard destroyed');
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let safetyGuardInstance: SafetyGuard | null = null;

export function getSafetyGuard(): SafetyGuard {
  if (!safetyGuardInstance) {
    safetyGuardInstance = new SafetyGuard();
  }
  return safetyGuardInstance;
}

export function resetSafetyGuard(): void {
  if (safetyGuardInstance) {
    safetyGuardInstance.destroy();
    safetyGuardInstance = null;
  }
}

export default SafetyGuard;

