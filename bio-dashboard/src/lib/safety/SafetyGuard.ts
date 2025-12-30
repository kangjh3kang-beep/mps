/**
 * ============================================================
 * MILITARY-GRADE HARDWARE SAFETY INTERLOCK
 * SafetyGuard - 하드웨어 안전 인터록 시스템
 * ============================================================
 * 
 * 목적: 소프트웨어가 물리적으로 사용자나 디바이스에
 *       해를 끼치는 것을 방지
 * 
 * 원칙:
 * - Fail-Safe by Default
 * - Hardware Abstraction Layer (HAL) Lock
 * - Defense in Depth
 * - Human-in-the-Loop for Critical Decisions
 * 
 * 규정 준수:
 * - IEC 62304 (의료기기 소프트웨어)
 * - IEC 60601-1 (의료 전기 장비)
 * - ISO 14971 (의료기기 위험 관리)
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type HardwareCommand =
  | 'EHD_IDLE'
  | 'EHD_LOW_VOLTAGE'
  | 'EHD_MEDIUM_VOLTAGE'
  | 'EHD_HIGH_VOLTAGE'
  | 'SENSOR_READ'
  | 'SENSOR_CALIBRATE'
  | 'MOTOR_START'
  | 'MOTOR_STOP'
  | 'HEATER_ON'
  | 'HEATER_OFF'
  | 'CHARGING_START'
  | 'CHARGING_STOP'
  | 'FIRMWARE_UPDATE'
  | 'FACTORY_RESET'
  | 'EMERGENCY_STOP';

export type SafetyLevel = 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER' | 'CRITICAL';

export interface DeviceState {
  skinContact: boolean;
  batteryTemp: number;       // °C
  batteryLevel: number;      // 0-100%
  deviceTemp: number;        // °C
  currentVoltage: number;    // mV
  currentCurrent: number;    // µA
  motorRunning: boolean;
  heaterActive: boolean;
  firmwareVersion: string;
  lastHeartbeat: number;     // timestamp
  errorCodes: string[];
  isCharging: boolean;
  wearableAttached: boolean;
}

export interface SafetyCheckResult {
  allowed: boolean;
  level: SafetyLevel;
  reason: string;
  requiredAction?: string;
  humanVerificationRequired?: boolean;
  emergencyStop?: boolean;
}

export interface AIPrediction {
  value: number;
  confidence: number;
  isExtreme: boolean;
  recommendation: string;
}

export interface SafetyEvent {
  id: string;
  timestamp: string;
  command: HardwareCommand;
  deviceState: Partial<DeviceState>;
  result: SafetyCheckResult;
  overriddenBy?: string;
}

// ============================================
// SAFETY THRESHOLDS (Hard-coded, Non-configurable)
// ============================================

const SAFETY_THRESHOLDS = Object.freeze({
  // 온도 제한 (°C)
  BATTERY_TEMP_MAX: 45,
  BATTERY_TEMP_MIN: 0,
  DEVICE_TEMP_MAX: 50,
  DEVICE_TEMP_WARNING: 40,
  
  // 전압/전류 제한
  VOLTAGE_MAX_NO_CONTACT: 48000,    // 48V (피부 접촉 없을 때)
  VOLTAGE_MAX_SKIN_CONTACT: 5000,   // 5V (피부 접촉 시)
  CURRENT_MAX_SKIN_CONTACT: 100,    // 100µA (피부 접촉 시)
  
  // 배터리 제한
  BATTERY_MIN_FOR_HIGH_POWER: 20,   // 고전력 작업 최소 배터리
  BATTERY_CRITICAL: 5,
  
  // 타이밍 제한
  HEARTBEAT_TIMEOUT_MS: 2000,       // 2초 하트비트 타임아웃
  MAX_CONTINUOUS_HIGH_VOLTAGE_MS: 30000, // 30초 최대 고전압 시간
  MOTOR_MAX_RUNTIME_MS: 60000,      // 1분 최대 모터 런타임
  
  // AI 예측 임계값
  AI_EXTREME_VALUE_THRESHOLD: 3.0,  // 표준편차 3배 이상
  AI_MIN_CONFIDENCE: 0.7,           // 최소 신뢰도 70%
});

// ============================================
// COMMAND RISK CLASSIFICATION
// ============================================

const COMMAND_RISK_LEVELS: Record<HardwareCommand, SafetyLevel> = {
  'EHD_IDLE': 'SAFE',
  'SENSOR_READ': 'SAFE',
  'MOTOR_STOP': 'SAFE',
  'HEATER_OFF': 'SAFE',
  'CHARGING_STOP': 'SAFE',
  'EMERGENCY_STOP': 'SAFE',
  
  'EHD_LOW_VOLTAGE': 'CAUTION',
  'SENSOR_CALIBRATE': 'CAUTION',
  
  'EHD_MEDIUM_VOLTAGE': 'WARNING',
  'MOTOR_START': 'WARNING',
  'HEATER_ON': 'WARNING',
  'CHARGING_START': 'WARNING',
  
  'EHD_HIGH_VOLTAGE': 'DANGER',
  
  'FIRMWARE_UPDATE': 'CRITICAL',
  'FACTORY_RESET': 'CRITICAL',
};

// ============================================
// SAFETY GUARD CLASS
// ============================================

export class SafetyGuard {
  private deviceState: DeviceState;
  private eventLog: SafetyEvent[] = [];
  private highVoltageStartTime: number | null = null;
  private motorStartTime: number | null = null;
  private isLocked: boolean = false;
  private lockReason: string = '';
  private lastHeartbeatCheck: number = Date.now();
  
  constructor(initialState?: Partial<DeviceState>) {
    this.deviceState = {
      skinContact: false,
      batteryTemp: 25,
      batteryLevel: 100,
      deviceTemp: 25,
      currentVoltage: 0,
      currentCurrent: 0,
      motorRunning: false,
      heaterActive: false,
      firmwareVersion: '1.0.0',
      lastHeartbeat: Date.now(),
      errorCodes: [],
      isCharging: false,
      wearableAttached: false,
      ...initialState
    };
    
    // Start watchdog
    this.startWatchdog();
  }

  // ============================================
  // WATCHDOG & HEARTBEAT SYSTEM
  // ============================================
  
  private watchdogInterval: ReturnType<typeof setInterval> | null = null;
  
  private startWatchdog(): void {
    this.watchdogInterval = setInterval(() => {
      this.checkHeartbeat();
    }, 500);
  }
  
  /**
   * Send heartbeat from app to hardware
   */
  sendHeartbeat(): void {
    this.deviceState.lastHeartbeat = Date.now();
  }
  
  /**
   * Check if heartbeat is alive
   */
  private checkHeartbeat(): void {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - this.deviceState.lastHeartbeat;
    
    if (timeSinceLastHeartbeat > SAFETY_THRESHOLDS.HEARTBEAT_TIMEOUT_MS) {
      console.error('[SAFETY] ⚠️ HEARTBEAT TIMEOUT - Initiating Emergency Stop');
      this.emergencyStop('HEARTBEAT_TIMEOUT');
    }
  }
  
  /**
   * Emergency stop - reset to safe state
   */
  emergencyStop(reason: string): void {
    this.isLocked = true;
    this.lockReason = reason;
    
    // Reset to safe state
    this.deviceState.currentVoltage = 0;
    this.deviceState.currentCurrent = 0;
    this.deviceState.motorRunning = false;
    this.deviceState.heaterActive = false;
    this.highVoltageStartTime = null;
    this.motorStartTime = null;
    
    this.logEvent('EMERGENCY_STOP', {
      allowed: false,
      level: 'CRITICAL',
      reason: `Emergency Stop: ${reason}`,
      emergencyStop: true
    });
    
    console.error(`[SAFETY] 🚨 EMERGENCY STOP ACTIVATED: ${reason}`);
  }
  
  /**
   * Stop watchdog (cleanup)
   */
  destroy(): void {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
    }
  }

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  updateState(newState: Partial<DeviceState>): void {
    this.deviceState = { ...this.deviceState, ...newState };
  }
  
  getState(): Readonly<DeviceState> {
    return Object.freeze({ ...this.deviceState });
  }
  
  isSystemLocked(): { locked: boolean; reason: string } {
    return { locked: this.isLocked, reason: this.lockReason };
  }
  
  unlock(adminPassword: string, adminId: string): boolean {
    // In production: Verify admin password and log
    if (adminPassword === process.env.SAFETY_OVERRIDE_KEY) {
      this.isLocked = false;
      this.lockReason = '';
      
      this.logEvent('EHD_IDLE', {
        allowed: true,
        level: 'WARNING',
        reason: `System unlocked by admin: ${adminId}`,
        requiredAction: 'Verify system state before resuming operations'
      });
      
      return true;
    }
    return false;
  }

  // ============================================
  // MAIN SAFETY CHECK
  // ============================================
  
  /**
   * The main HAL Lock - ALL hardware commands must pass through here
   */
  checkCommand(command: HardwareCommand): SafetyCheckResult {
    // System lock check
    if (this.isLocked && command !== 'EMERGENCY_STOP') {
      return {
        allowed: false,
        level: 'CRITICAL',
        reason: `System is locked: ${this.lockReason}`,
        requiredAction: 'Contact administrator to unlock system'
      };
    }
    
    const riskLevel = COMMAND_RISK_LEVELS[command];
    
    // Run all safety checks
    const checks = [
      this.checkSkinContactSafety(command),
      this.checkBatteryTemperature(command),
      this.checkDeviceTemperature(command),
      this.checkBatteryLevel(command),
      this.checkContinuousOperation(command),
      this.checkErrorCodes(command)
    ];
    
    // Find the most severe failure
    const failures = checks.filter(c => !c.allowed);
    if (failures.length > 0) {
      // Sort by severity
      const severityOrder: SafetyLevel[] = ['CRITICAL', 'DANGER', 'WARNING', 'CAUTION', 'SAFE'];
      failures.sort((a, b) => 
        severityOrder.indexOf(a.level) - severityOrder.indexOf(b.level)
      );
      
      const result = failures[0];
      this.logEvent(command, result);
      
      // Auto emergency stop for CRITICAL
      if (result.level === 'CRITICAL') {
        this.emergencyStop(result.reason);
      }
      
      return result;
    }
    
    // All checks passed
    const result: SafetyCheckResult = {
      allowed: true,
      level: riskLevel,
      reason: 'All safety checks passed'
    };
    
    // Update state based on command
    this.applyCommandSideEffects(command);
    this.logEvent(command, result);
    
    return result;
  }
  
  // ============================================
  // INDIVIDUAL SAFETY CHECKS
  // ============================================
  
  /**
   * RULE: IF EHD_HIGH_VOLTAGE AND Skin_Contact == TRUE -> BLOCK & ALARM
   */
  private checkSkinContactSafety(command: HardwareCommand): SafetyCheckResult {
    if (command === 'EHD_HIGH_VOLTAGE' && this.deviceState.skinContact) {
      return {
        allowed: false,
        level: 'CRITICAL',
        reason: 'HIGH VOLTAGE BLOCKED: Skin contact detected',
        requiredAction: 'Remove device from skin before high voltage operation',
        emergencyStop: true
      };
    }
    
    if (command === 'EHD_MEDIUM_VOLTAGE' && this.deviceState.skinContact) {
      const maxVoltage = SAFETY_THRESHOLDS.VOLTAGE_MAX_SKIN_CONTACT;
      if (this.deviceState.currentVoltage > maxVoltage) {
        return {
          allowed: false,
          level: 'DANGER',
          reason: `Voltage ${this.deviceState.currentVoltage}mV exceeds skin-safe limit ${maxVoltage}mV`,
          requiredAction: 'Reduce voltage or remove skin contact'
        };
      }
    }
    
    return { allowed: true, level: 'SAFE', reason: 'Skin contact check passed' };
  }
  
  /**
   * RULE: IF Battery_Temp > 45°C -> SHUTDOWN CHARGING
   */
  private checkBatteryTemperature(command: HardwareCommand): SafetyCheckResult {
    const temp = this.deviceState.batteryTemp;
    
    if (temp > SAFETY_THRESHOLDS.BATTERY_TEMP_MAX) {
      if (command === 'CHARGING_START' || this.deviceState.isCharging) {
        this.deviceState.isCharging = false;
        return {
          allowed: false,
          level: 'CRITICAL',
          reason: `Battery temperature ${temp}°C exceeds max ${SAFETY_THRESHOLDS.BATTERY_TEMP_MAX}°C`,
          requiredAction: 'Stop charging and allow battery to cool',
          emergencyStop: true
        };
      }
    }
    
    if (temp < SAFETY_THRESHOLDS.BATTERY_TEMP_MIN) {
      if (['EHD_HIGH_VOLTAGE', 'EHD_MEDIUM_VOLTAGE'].includes(command)) {
        return {
          allowed: false,
          level: 'DANGER',
          reason: `Battery temperature ${temp}°C below safe minimum ${SAFETY_THRESHOLDS.BATTERY_TEMP_MIN}°C`,
          requiredAction: 'Warm device to room temperature before use'
        };
      }
    }
    
    return { allowed: true, level: 'SAFE', reason: 'Battery temperature check passed' };
  }
  
  /**
   * Check device temperature
   */
  private checkDeviceTemperature(command: HardwareCommand): SafetyCheckResult {
    const temp = this.deviceState.deviceTemp;
    
    if (temp > SAFETY_THRESHOLDS.DEVICE_TEMP_MAX) {
      return {
        allowed: false,
        level: 'CRITICAL',
        reason: `Device temperature ${temp}°C exceeds max ${SAFETY_THRESHOLDS.DEVICE_TEMP_MAX}°C`,
        requiredAction: 'Shutdown and allow device to cool',
        emergencyStop: true
      };
    }
    
    if (temp > SAFETY_THRESHOLDS.DEVICE_TEMP_WARNING) {
      if (command === 'HEATER_ON') {
        return {
          allowed: false,
          level: 'WARNING',
          reason: `Device temperature ${temp}°C - heater disabled for safety`,
          requiredAction: 'Wait for device to cool before enabling heater'
        };
      }
    }
    
    return { allowed: true, level: 'SAFE', reason: 'Device temperature check passed' };
  }
  
  /**
   * Check battery level for high-power operations
   */
  private checkBatteryLevel(command: HardwareCommand): SafetyCheckResult {
    const level = this.deviceState.batteryLevel;
    
    if (level < SAFETY_THRESHOLDS.BATTERY_CRITICAL) {
      if (!['EMERGENCY_STOP', 'CHARGING_START', 'EHD_IDLE'].includes(command)) {
        return {
          allowed: false,
          level: 'DANGER',
          reason: `Critical battery level ${level}%`,
          requiredAction: 'Charge device immediately'
        };
      }
    }
    
    if (level < SAFETY_THRESHOLDS.BATTERY_MIN_FOR_HIGH_POWER) {
      if (['EHD_HIGH_VOLTAGE', 'MOTOR_START', 'FIRMWARE_UPDATE'].includes(command)) {
        return {
          allowed: false,
          level: 'WARNING',
          reason: `Battery ${level}% too low for high-power operation`,
          requiredAction: `Charge to at least ${SAFETY_THRESHOLDS.BATTERY_MIN_FOR_HIGH_POWER}%`
        };
      }
    }
    
    return { allowed: true, level: 'SAFE', reason: 'Battery level check passed' };
  }
  
  /**
   * Check continuous operation limits
   */
  private checkContinuousOperation(command: HardwareCommand): SafetyCheckResult {
    const now = Date.now();
    
    // High voltage time limit
    if (command === 'EHD_HIGH_VOLTAGE') {
      if (!this.highVoltageStartTime) {
        this.highVoltageStartTime = now;
      } else {
        const duration = now - this.highVoltageStartTime;
        if (duration > SAFETY_THRESHOLDS.MAX_CONTINUOUS_HIGH_VOLTAGE_MS) {
          return {
            allowed: false,
            level: 'DANGER',
            reason: `High voltage exceeded max continuous time (${Math.floor(duration/1000)}s)`,
            requiredAction: 'Allow system to rest before resuming high voltage operation'
          };
        }
      }
    } else {
      this.highVoltageStartTime = null;
    }
    
    // Motor runtime limit
    if (command === 'MOTOR_START') {
      if (!this.motorStartTime) {
        this.motorStartTime = now;
      } else if (this.deviceState.motorRunning) {
        const duration = now - this.motorStartTime;
        if (duration > SAFETY_THRESHOLDS.MOTOR_MAX_RUNTIME_MS) {
          return {
            allowed: false,
            level: 'WARNING',
            reason: `Motor exceeded max runtime (${Math.floor(duration/1000)}s)`,
            requiredAction: 'Stop motor and allow to cool'
          };
        }
      }
    }
    if (command === 'MOTOR_STOP') {
      this.motorStartTime = null;
    }
    
    return { allowed: true, level: 'SAFE', reason: 'Continuous operation check passed' };
  }
  
  /**
   * Check for existing error codes
   */
  private checkErrorCodes(command: HardwareCommand): SafetyCheckResult {
    const criticalErrors = this.deviceState.errorCodes.filter(code => 
      code.startsWith('CRIT_') || code.startsWith('FATAL_')
    );
    
    if (criticalErrors.length > 0 && command !== 'EMERGENCY_STOP') {
      return {
        allowed: false,
        level: 'CRITICAL',
        reason: `Critical errors present: ${criticalErrors.join(', ')}`,
        requiredAction: 'Resolve critical errors before proceeding'
      };
    }
    
    return { allowed: true, level: 'SAFE', reason: 'Error code check passed' };
  }
  
  // ============================================
  // AI PREDICTION SAFETY
  // ============================================
  
  /**
   * RULE: IF AI_Prediction == EXTREME_VALUE -> REQUIRE HUMAN VERIFICATION
   * Prevents AI hallucination from causing panic
   */
  validateAIPrediction(prediction: AIPrediction): SafetyCheckResult {
    // Check confidence
    if (prediction.confidence < SAFETY_THRESHOLDS.AI_MIN_CONFIDENCE) {
      return {
        allowed: false,
        level: 'CAUTION',
        reason: `AI confidence ${(prediction.confidence * 100).toFixed(1)}% below minimum`,
        requiredAction: 'Re-run measurement or consult professional',
        humanVerificationRequired: true
      };
    }
    
    // Check for extreme values
    if (prediction.isExtreme) {
      return {
        allowed: false,
        level: 'WARNING',
        reason: 'AI prediction indicates extreme value - requires verification',
        requiredAction: 'Human verification required before displaying to user',
        humanVerificationRequired: true
      };
    }
    
    return {
      allowed: true,
      level: 'SAFE',
      reason: 'AI prediction within normal parameters'
    };
  }
  
  // ============================================
  // COMMAND SIDE EFFECTS
  // ============================================
  
  private applyCommandSideEffects(command: HardwareCommand): void {
    switch (command) {
      case 'MOTOR_START':
        this.deviceState.motorRunning = true;
        break;
      case 'MOTOR_STOP':
        this.deviceState.motorRunning = false;
        break;
      case 'HEATER_ON':
        this.deviceState.heaterActive = true;
        break;
      case 'HEATER_OFF':
        this.deviceState.heaterActive = false;
        break;
      case 'CHARGING_START':
        this.deviceState.isCharging = true;
        break;
      case 'CHARGING_STOP':
        this.deviceState.isCharging = false;
        break;
      case 'EHD_IDLE':
        this.deviceState.currentVoltage = 0;
        this.deviceState.currentCurrent = 0;
        break;
    }
  }
  
  // ============================================
  // EVENT LOGGING
  // ============================================
  
  private logEvent(command: HardwareCommand, result: SafetyCheckResult): void {
    const event: SafetyEvent = {
      id: `SAFETY_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      command,
      deviceState: { ...this.deviceState },
      result
    };
    
    this.eventLog.push(event);
    
    // Keep last 1000 events
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-1000);
    }
    
    // Console log based on severity
    const icons: Record<SafetyLevel, string> = {
      'SAFE': '✅',
      'CAUTION': '⚠️',
      'WARNING': '🟡',
      'DANGER': '🟠',
      'CRITICAL': '🚨'
    };
    
    console.log(
      `[SAFETY] ${icons[result.level]} ${command}: ${result.reason}` +
      (result.allowed ? '' : ' [BLOCKED]')
    );
  }
  
  getEventLog(limit: number = 100): SafetyEvent[] {
    return this.eventLog.slice(-limit);
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

export function resetSafetyGuard(initialState?: Partial<DeviceState>): SafetyGuard {
  if (safetyGuardInstance) {
    safetyGuardInstance.destroy();
  }
  safetyGuardInstance = new SafetyGuard(initialState);
  return safetyGuardInstance;
}

// ============================================
// HARDWARE COMMAND WRAPPER
// ============================================

export async function executeHardwareCommand(
  command: HardwareCommand,
  options?: { force?: boolean; adminId?: string }
): Promise<{ success: boolean; result: SafetyCheckResult }> {
  const guard = getSafetyGuard();
  
  // Safety check
  const result = guard.checkCommand(command);
  
  if (!result.allowed && !options?.force) {
    return { success: false, result };
  }
  
  if (!result.allowed && options?.force && options?.adminId) {
    // Log forced override
    console.warn(
      `[SAFETY] ⚠️ FORCED OVERRIDE by ${options.adminId}: ${command}`
    );
    // Still return the safety result but mark as overridden
    return { 
      success: true, 
      result: { 
        ...result, 
        reason: `FORCE OVERRIDE: ${result.reason}` 
      } 
    };
  }
  
  return { success: result.allowed, result };
}

export default SafetyGuard;

