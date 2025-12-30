/**
 * ============================================================
 * MOTION ARTIFACT CANCELLATION (MAC) ALGORITHM
 * ============================================================
 * 
 * Generated from 41-Persona Simulation
 * Addressing: User #12 (센서 전문가), User #22 (축구 선수)
 * Issue: "운동 중 모션 아티팩트로 인한 신호 왜곡"
 * 
 * Algorithm: Adaptive Filtering with Accelerometer Reference
 * Based on: Least Mean Squares (LMS) adaptive filter
 */

// ============================================
// TYPES
// ============================================

export interface AccelerometerData {
  x: number;  // -16g ~ +16g
  y: number;
  z: number;
  timestamp: number;
}

export interface RawSignalData {
  voltage: number;      // mV
  current: number;      // μA
  timestamp: number;
}

export interface FilteredSignal {
  originalVoltage: number;
  filteredVoltage: number;
  motionLevel: number;      // 0-1: Motion intensity
  confidence: number;       // 0-1: Signal confidence
  isArtifactFree: boolean;
}

// ============================================
// LMS ADAPTIVE FILTER
// ============================================

export class LMSAdaptiveFilter {
  private weights: number[];
  private readonly filterOrder: number;
  private readonly mu: number;  // Step size (learning rate)
  private history: number[];

  constructor(filterOrder = 16, stepSize = 0.01) {
    this.filterOrder = filterOrder;
    this.mu = stepSize;
    this.weights = new Array(filterOrder).fill(0);
    this.history = new Array(filterOrder).fill(0);
  }

  /**
   * 적응형 필터 업데이트 및 출력 계산
   * @param input Reference signal (accelerometer magnitude)
   * @param desired Primary signal (raw sensor voltage)
   * @returns Filtered output (motion-artifact-free signal)
   */
  update(input: number, desired: number): number {
    // Shift history
    this.history.pop();
    this.history.unshift(input);

    // Calculate filter output (estimated artifact)
    let estimatedArtifact = 0;
    for (let i = 0; i < this.filterOrder; i++) {
      estimatedArtifact += this.weights[i] * this.history[i];
    }

    // Error = desired - estimated (clean signal)
    const error = desired - estimatedArtifact;

    // Update weights using LMS algorithm
    for (let i = 0; i < this.filterOrder; i++) {
      this.weights[i] += this.mu * error * this.history[i];
    }

    return error;  // Filtered signal (artifact removed)
  }

  /**
   * 필터 초기화
   */
  reset(): void {
    this.weights.fill(0);
    this.history.fill(0);
  }
}

// ============================================
// MOTION DETECTOR
// ============================================

export class MotionDetector {
  private static readonly MOTION_THRESHOLD_LOW = 0.3;   // g
  private static readonly MOTION_THRESHOLD_HIGH = 1.5;  // g
  private previousMagnitude = 0;
  private smoothedMagnitude = 0;
  private readonly alpha = 0.3;  // EMA smoothing factor

  /**
   * 가속도계 데이터로부터 모션 레벨 계산
   */
  detectMotion(accel: AccelerometerData): {
    magnitude: number;
    level: 'still' | 'walking' | 'running' | 'intense';
    normalizedLevel: number;
  } {
    // Calculate magnitude
    const magnitude = Math.sqrt(
      accel.x ** 2 + accel.y ** 2 + accel.z ** 2
    );

    // Remove gravity (assuming ~1g at rest)
    const dynamicMagnitude = Math.abs(magnitude - 1.0);

    // Apply exponential moving average
    this.smoothedMagnitude = 
      this.alpha * dynamicMagnitude + 
      (1 - this.alpha) * this.smoothedMagnitude;

    // Classify motion level
    let level: 'still' | 'walking' | 'running' | 'intense';
    if (this.smoothedMagnitude < MotionDetector.MOTION_THRESHOLD_LOW) {
      level = 'still';
    } else if (this.smoothedMagnitude < 0.7) {
      level = 'walking';
    } else if (this.smoothedMagnitude < MotionDetector.MOTION_THRESHOLD_HIGH) {
      level = 'running';
    } else {
      level = 'intense';
    }

    // Normalize to 0-1 range
    const normalizedLevel = Math.min(1, this.smoothedMagnitude / 2.0);

    this.previousMagnitude = magnitude;

    return {
      magnitude: this.smoothedMagnitude,
      level,
      normalizedLevel
    };
  }
}

// ============================================
// MOTION ARTIFACT CANCELLATION ENGINE
// ============================================

export class MotionArtifactCancellation {
  private lmsFilter: LMSAdaptiveFilter;
  private motionDetector: MotionDetector;
  private signalBuffer: number[] = [];
  private readonly bufferSize = 100;
  private readonly minConfidenceThreshold = 0.7;

  constructor() {
    this.lmsFilter = new LMSAdaptiveFilter(16, 0.015);
    this.motionDetector = new MotionDetector();
  }

  /**
   * 센서 신호에서 모션 아티팩트 제거
   * @param rawSignal Raw sensor measurement
   * @param accel Accelerometer data (synchronous)
   * @returns Filtered signal with quality metrics
   */
  filter(
    rawSignal: RawSignalData, 
    accel: AccelerometerData
  ): FilteredSignal {
    // Detect motion level
    const motion = this.motionDetector.detectMotion(accel);

    // Calculate accelerometer magnitude as reference
    const accelMagnitude = Math.sqrt(
      accel.x ** 2 + accel.y ** 2 + accel.z ** 2
    ) - 1.0;  // Remove gravity

    // Apply LMS adaptive filter
    const filteredVoltage = this.lmsFilter.update(
      accelMagnitude,
      rawSignal.voltage
    );

    // Add to buffer for statistics
    this.signalBuffer.push(filteredVoltage);
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.shift();
    }

    // Calculate signal confidence based on variance reduction
    const variance = this.calculateVariance(this.signalBuffer);
    const baselineVariance = 0.1;  // Expected variance at rest
    const varianceRatio = baselineVariance / Math.max(variance, 0.001);
    const confidence = Math.min(1, Math.max(0, varianceRatio));

    // Determine if signal is artifact-free
    const isArtifactFree = 
      motion.level === 'still' || 
      (motion.level === 'walking' && confidence > this.minConfidenceThreshold);

    return {
      originalVoltage: rawSignal.voltage,
      filteredVoltage,
      motionLevel: motion.normalizedLevel,
      confidence,
      isArtifactFree
    };
  }

  /**
   * 분산 계산
   */
  private calculateVariance(data: number[]): number {
    if (data.length < 2) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(x => (x - mean) ** 2);
    return squaredDiffs.reduce((a, b) => a + b, 0) / (data.length - 1);
  }

  /**
   * 측정 가능 여부 확인
   * 격렬한 운동 중에는 측정 권장하지 않음
   */
  shouldMeasure(accel: AccelerometerData): {
    canMeasure: boolean;
    message: string;
  } {
    const motion = this.motionDetector.detectMotion(accel);

    if (motion.level === 'still') {
      return {
        canMeasure: true,
        message: "측정 가능합니다."
      };
    } else if (motion.level === 'walking') {
      return {
        canMeasure: true,
        message: "가벼운 움직임이 감지됩니다. 정확도가 다소 낮아질 수 있습니다."
      };
    } else if (motion.level === 'running') {
      return {
        canMeasure: false,
        message: "움직임이 많습니다. 멈춘 후 측정해주세요."
      };
    } else {
      return {
        canMeasure: false,
        message: "격렬한 운동 중입니다. 휴식 후 측정해주세요."
      };
    }
  }

  /**
   * 필터 리셋
   */
  reset(): void {
    this.lmsFilter.reset();
    this.signalBuffer = [];
  }
}

// ============================================
// C CODE GENERATION (For Firmware)
// ============================================

/**
 * 펌웨어용 C 코드 생성
 * STM32/ESP32 등의 임베디드 시스템에서 사용
 */
export const MOTION_FILTER_C_CODE = `
/*
 * Motion Artifact Cancellation (MAC) for Manpasik Firmware
 * LMS Adaptive Filter Implementation
 * 
 * Target: STM32F4 / ESP32
 * Author: Manpasik AI System
 */

#ifndef MOTION_FILTER_H
#define MOTION_FILTER_H

#include <stdint.h>
#include <math.h>

#define LMS_FILTER_ORDER 16
#define LMS_STEP_SIZE 0.015f
#define MOTION_THRESHOLD_LOW 0.3f
#define MOTION_THRESHOLD_HIGH 1.5f

typedef struct {
    float weights[LMS_FILTER_ORDER];
    float history[LMS_FILTER_ORDER];
    float smoothed_magnitude;
} MotionFilter_t;

// Initialize filter
void MotionFilter_Init(MotionFilter_t* filter) {
    for (int i = 0; i < LMS_FILTER_ORDER; i++) {
        filter->weights[i] = 0.0f;
        filter->history[i] = 0.0f;
    }
    filter->smoothed_magnitude = 0.0f;
}

// Calculate accelerometer magnitude
float MotionFilter_GetMagnitude(float ax, float ay, float az) {
    float mag = sqrtf(ax*ax + ay*ay + az*az);
    return fabs(mag - 1.0f);  // Remove gravity
}

// Detect motion level (returns 0-3: still, walking, running, intense)
uint8_t MotionFilter_DetectMotion(MotionFilter_t* filter, float ax, float ay, float az) {
    float dynamic_mag = MotionFilter_GetMagnitude(ax, ay, az);
    
    // EMA smoothing
    filter->smoothed_magnitude = 0.3f * dynamic_mag + 0.7f * filter->smoothed_magnitude;
    
    if (filter->smoothed_magnitude < MOTION_THRESHOLD_LOW) return 0;  // still
    if (filter->smoothed_magnitude < 0.7f) return 1;  // walking
    if (filter->smoothed_magnitude < MOTION_THRESHOLD_HIGH) return 2;  // running
    return 3;  // intense
}

// Apply LMS adaptive filter
float MotionFilter_Apply(MotionFilter_t* filter, float raw_voltage, float ax, float ay, float az) {
    float accel_ref = MotionFilter_GetMagnitude(ax, ay, az);
    
    // Shift history
    for (int i = LMS_FILTER_ORDER - 1; i > 0; i--) {
        filter->history[i] = filter->history[i-1];
    }
    filter->history[0] = accel_ref;
    
    // Calculate estimated artifact
    float estimated_artifact = 0.0f;
    for (int i = 0; i < LMS_FILTER_ORDER; i++) {
        estimated_artifact += filter->weights[i] * filter->history[i];
    }
    
    // Error = clean signal
    float error = raw_voltage - estimated_artifact;
    
    // Update weights (LMS)
    for (int i = 0; i < LMS_FILTER_ORDER; i++) {
        filter->weights[i] += LMS_STEP_SIZE * error * filter->history[i];
    }
    
    return error;  // Filtered voltage
}

// Check if measurement is recommended
uint8_t MotionFilter_CanMeasure(MotionFilter_t* filter, float ax, float ay, float az) {
    uint8_t motion_level = MotionFilter_DetectMotion(filter, ax, ay, az);
    return (motion_level <= 1);  // OK for still or walking
}

#endif // MOTION_FILTER_H
`;

// Export singleton instance
export const motionArtifactCancellation = new MotionArtifactCancellation();






