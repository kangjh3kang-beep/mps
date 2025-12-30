/**
 * SafetyGuard Unit Tests
 * Verifies hardware safety interlock functionality
 */

import {
  SafetyGuard,
  HardwareCommand,
  SafetyState,
  SAFETY_LIMITS,
  getSafetyGuard,
  resetSafetyGuard,
} from '@/lib/hardware/SafetyGuard';

describe('SafetyGuard', () => {
  let safetyGuard: SafetyGuard;

  beforeEach(() => {
    resetSafetyGuard();
    safetyGuard = new SafetyGuard();
  });

  afterEach(() => {
    safetyGuard.destroy();
  });

  describe('Voltage + Skin Contact Safety', () => {
    it('should BLOCK high voltage when skin contact is detected', () => {
      // Simulate skin contact
      safetyGuard.updateState({ skinContact: true });

      // Try to set high voltage
      const result = safetyGuard.executeCommand({
        command: HardwareCommand.SET_EHD_VOLTAGE,
        params: { voltage: 12 },
      });

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.violations).toBeDefined();
      expect(result.violations!.some(v => v.type === 'SKIN_CONTACT_VIOLATION')).toBe(true);
    });

    it('should ALLOW safe voltage with skin contact', () => {
      safetyGuard.updateState({ skinContact: true });

      const result = safetyGuard.executeCommand({
        command: HardwareCommand.SET_EHD_VOLTAGE,
        params: { voltage: 3.0 },
      });

      expect(result.success).toBe(true);
      expect(result.blocked).toBe(false);
    });

    it('should BLOCK voltage exceeding critical limit', () => {
      const result = safetyGuard.executeCommand({
        command: HardwareCommand.SET_EHD_VOLTAGE,
        params: { voltage: 30 }, // Exceeds 24V critical limit
      });

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.violations!.some(v => v.type === 'VOLTAGE_EXCEEDED')).toBe(true);
    });
  });

  describe('Temperature Safety', () => {
    it('should BLOCK charging when battery temperature exceeds limit', () => {
      safetyGuard.updateState({ batteryTemp: 50 }); // Exceeds 45°C

      const result = safetyGuard.executeCommand({
        command: HardwareCommand.START_CHARGING,
      });

      expect(result.success).toBe(false);
      expect(result.violations!.some(v => v.type === 'TEMPERATURE_EXCEEDED')).toBe(true);
    });

    it('should ALLOW charging at normal temperature', () => {
      safetyGuard.updateState({ batteryTemp: 30 });

      const result = safetyGuard.executeCommand({
        command: HardwareCommand.START_CHARGING,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Sensor Safety', () => {
    it('should BLOCK measurement when sensor is disconnected', () => {
      safetyGuard.updateState({ sensorConnected: false });

      const result = safetyGuard.executeCommand({
        command: HardwareCommand.START_MEASUREMENT,
      });

      expect(result.success).toBe(false);
      expect(result.violations!.some(v => v.type === 'SENSOR_ERROR')).toBe(true);
    });

    it('should BLOCK measurement when ADC value is out of range', () => {
      safetyGuard.updateState({ adcValue: 50 }); // Below MIN_VALID_ADC (100)

      const result = safetyGuard.executeCommand({
        command: HardwareCommand.START_MEASUREMENT,
      });

      expect(result.success).toBe(false);
      expect(result.violations!.some(v => v.type === 'SENSOR_ERROR')).toBe(true);
    });
  });

  describe('AI Prediction Validation', () => {
    it('should REJECT glucose values outside valid range', () => {
      const result = safetyGuard.validateAIPrediction(10, 'glucose'); // Below 20 mg/dL

      expect(result.valid).toBe(false);
      expect(result.requiresHumanVerification).toBe(true);
      expect(result.message).toContain('유효 범위');
    });

    it('should REQUIRE verification for extreme but possible values', () => {
      // Low glucose (hypoglycemia)
      const lowResult = safetyGuard.validateAIPrediction(50, 'glucose');
      expect(lowResult.valid).toBe(true);
      expect(lowResult.requiresHumanVerification).toBe(true);
      expect(lowResult.message).toContain('저혈당');

      // High glucose
      const highResult = safetyGuard.validateAIPrediction(300, 'glucose');
      expect(highResult.valid).toBe(true);
      expect(highResult.requiresHumanVerification).toBe(true);
      expect(highResult.message).toContain('고혈당');
    });

    it('should ACCEPT normal glucose values', () => {
      const result = safetyGuard.validateAIPrediction(100, 'glucose');

      expect(result.valid).toBe(true);
      expect(result.requiresHumanVerification).toBe(false);
    });
  });

  describe('Emergency Handling', () => {
    it('should trigger emergency and lock system on skin contact + HV', () => {
      let emergencyTriggered = false;
      safetyGuard.setEmergencyCallback(() => {
        emergencyTriggered = true;
      });

      // Enable high voltage first
      safetyGuard.executeCommand({
        command: HardwareCommand.ENABLE_HIGH_VOLTAGE,
      });
      safetyGuard.updateState({ highVoltageEnabled: true });

      // Now detect skin contact - should trigger emergency
      safetyGuard.updateState({ skinContact: true });

      expect(emergencyTriggered).toBe(true);
      expect(safetyGuard.isLocked()).toBe(true);
    });

    it('should reset all outputs in safe mode', () => {
      // Set some outputs
      safetyGuard.executeCommand({
        command: HardwareCommand.SET_EHD_VOLTAGE,
        params: { voltage: 5 },
      });
      safetyGuard.executeCommand({
        command: HardwareCommand.START_PUMP,
        params: { speed: 1000 },
      });

      // Enter safe mode
      safetyGuard.executeCommand({
        command: HardwareCommand.ENTER_SAFE_MODE,
      });

      const state = safetyGuard.getState();
      expect(state.ehdVoltage).toBe(0);
      expect(state.pumpRunning).toBe(false);
      expect(state.safetyState).toBe(SafetyState.LOCKED);
    });
  });

  describe('Heartbeat Monitoring', () => {
    it('should update last heartbeat time', () => {
      const beforeHeartbeat = safetyGuard.getState().lastHeartbeat;
      
      // Wait a bit
      jest.advanceTimersByTime(100);
      
      safetyGuard.heartbeat();
      
      const afterHeartbeat = safetyGuard.getState().lastHeartbeat;
      expect(afterHeartbeat).toBeGreaterThanOrEqual(beforeHeartbeat);
    });
  });

  describe('Audit Logging', () => {
    it('should log all command attempts', () => {
      safetyGuard.executeCommand({
        command: HardwareCommand.START_PUMP,
        userId: 'test-user',
      });

      const logs = safetyGuard.getAuditLog();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(l => l.action.includes('START_PUMP'))).toBe(true);
    });

    it('should log blocked commands', () => {
      safetyGuard.updateState({ skinContact: true });
      
      safetyGuard.executeCommand({
        command: HardwareCommand.SET_EHD_VOLTAGE,
        params: { voltage: 20 },
        userId: 'test-user',
      });

      const logs = safetyGuard.getAuditLog();
      expect(logs.some(l => l.action.includes('BLOCKED'))).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getSafetyGuard', () => {
      const instance1 = getSafetyGuard();
      const instance2 = getSafetyGuard();
      
      expect(instance1).toBe(instance2);
    });

    it('should reset instance with resetSafetyGuard', () => {
      const instance1 = getSafetyGuard();
      resetSafetyGuard();
      const instance2 = getSafetyGuard();
      
      expect(instance1).not.toBe(instance2);
    });
  });
});


