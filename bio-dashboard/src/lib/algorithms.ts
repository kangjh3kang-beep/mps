/**
 * Bio-Analysis Signal Processing Algorithms
 * Part 3 기반 구현
 */

/* ============================================
 * 1. Differential Signal Processing
 * ============================================
 * Part 3 Section 2.1: 차동 신호 처리
 * 
 * 두 채널(작업 전극, 참조 전극)에서 공통 모드 노이즈를 제거합니다.
 * - Working electrode: 분석물 반응 신호 + 공통 노이즈
 * - Reference electrode: 참조 신호 + 공통 노이즈
 * - Differential = Working - Reference → 공통 노이즈 상쇄
 */

/**
 * 차동 신호 처리: 공통 모드 노이즈 제거
 * 
 * @param working - 작업 전극(Working electrode) 전압 (V)
 * @param reference - 참조 전극(Reference electrode) 전압 (V)
 * @returns 차동 신호 (V) - 공통 모드 노이즈가 제거된 순수 신호
 */
export function processDifferentialSignal(
  working: number,
  reference: number
): number {
  // 차동 신호 = Working - Reference
  // 공통 모드 노이즈(온도 드리프트, 전자기 간섭 등)가 상쇄됨
  return working - reference;
}

/**
 * 여러 쌍의 전압값에 대해 차동 신호 처리를 일괄 수행
 * 
 * @param pairs - [working, reference] 쌍의 배열
 * @returns 차동 신호 배열
 */
export function processDifferentialSignalBatch(
  pairs: [number, number][]
): number[] {
  return pairs.map(([working, reference]) =>
    processDifferentialSignal(working, reference)
  );
}

/* ============================================
 * 2. Simplified 1D Kalman Filter
 * ============================================
 * Part 3 Section 2.2: 칼만 필터 기반 노이즈 감소
 * 
 * 상태 방정식 (1D 단순화):
 * - 예측: x̂_k⁻ = x̂_{k-1}
 * - 예측 오차 공분산: P_k⁻ = P_{k-1} + Q
 * - 칼만 이득: K_k = P_k⁻ / (P_k⁻ + R)
 * - 업데이트: x̂_k = x̂_k⁻ + K_k × (z_k - x̂_k⁻)
 * - 오차 공분산 업데이트: P_k = (1 - K_k) × P_k⁻
 * 
 * 여기서:
 * - x̂: 상태 추정값 (필터링된 전압)
 * - P: 추정 오차 공분산
 * - Q: 프로세스 노이즈 분산 (시스템의 불확실성)
 * - R: 측정 노이즈 분산 (센서의 불확실성)
 * - K: 칼만 이득
 * - z: 측정값
 */

export interface KalmanFilterConfig {
  /** 프로세스 노이즈 분산 (Q) - 시스템 동역학의 불확실성 */
  processNoise: number;
  /** 측정 노이즈 분산 (R) - 센서 측정의 불확실성 */
  measurementNoise: number;
  /** 초기 추정값 (선택) */
  initialEstimate?: number;
  /** 초기 오차 공분산 (선택) */
  initialErrorCovariance?: number;
}

export interface KalmanFilterState {
  estimate: number;        // x̂: 현재 상태 추정값
  errorCovariance: number; // P: 추정 오차 공분산
  kalmanGain: number;      // K: 마지막 칼만 이득
}

/**
 * 1D 칼만 필터 클래스
 * 
 * Part 3 Section 2.2 기반 구현
 * 시계열 전압 데이터의 노이즈를 실시간으로 감소시킵니다.
 */
export class KalmanFilter1D {
  private estimate: number;        // x̂
  private errorCovariance: number; // P
  private processNoise: number;    // Q
  private measurementNoise: number;// R
  private kalmanGain: number = 0;  // K

  constructor(config: KalmanFilterConfig) {
    this.processNoise = config.processNoise;
    this.measurementNoise = config.measurementNoise;
    this.estimate = config.initialEstimate ?? 0;
    this.errorCovariance = config.initialErrorCovariance ?? 1;
  }

  /**
   * 새 측정값으로 필터 상태를 업데이트
   * 
   * @param measurement - 새 측정값 (z_k)
   * @returns 필터링된 추정값
   */
  update(measurement: number): number {
    // 1. 예측 단계 (Predict)
    // 1D 정적 모델에서는 상태 전이가 없으므로 x̂_k⁻ = x̂_{k-1}
    const predictedEstimate = this.estimate;
    
    // 예측 오차 공분산: P_k⁻ = P_{k-1} + Q
    const predictedErrorCov = this.errorCovariance + this.processNoise;

    // 2. 업데이트 단계 (Update)
    // 칼만 이득: K_k = P_k⁻ / (P_k⁻ + R)
    this.kalmanGain = predictedErrorCov / (predictedErrorCov + this.measurementNoise);

    // 상태 업데이트: x̂_k = x̂_k⁻ + K_k × (z_k - x̂_k⁻)
    this.estimate = predictedEstimate + this.kalmanGain * (measurement - predictedEstimate);

    // 오차 공분산 업데이트: P_k = (1 - K_k) × P_k⁻
    this.errorCovariance = (1 - this.kalmanGain) * predictedErrorCov;

    return this.estimate;
  }

  /**
   * 여러 측정값을 순차적으로 처리
   * 
   * @param measurements - 측정값 배열
   * @returns 필터링된 값 배열
   */
  updateBatch(measurements: number[]): number[] {
    return measurements.map((m) => this.update(m));
  }

  /**
   * 현재 필터 상태 조회
   */
  getState(): KalmanFilterState {
    return {
      estimate: this.estimate,
      errorCovariance: this.errorCovariance,
      kalmanGain: this.kalmanGain
    };
  }

  /**
   * 필터 상태 리셋
   */
  reset(initialEstimate = 0, initialErrorCovariance = 1): void {
    this.estimate = initialEstimate;
    this.errorCovariance = initialErrorCovariance;
    this.kalmanGain = 0;
  }
}

/* ============================================
 * 3. Signal Processing Pipeline
 * ============================================
 * 차동 신호 처리 + 칼만 필터를 결합한 파이프라인
 */

export interface ProcessedSignalResult {
  /** 원시 차동 신호들 */
  differentialSignals: number[];
  /** 칼만 필터링된 최종 값 */
  filteredValue: number;
  /** 칼만 필터 상태 */
  filterState: KalmanFilterState;
  /** 처리 로그 (디버깅용) */
  processingLog: string[];
}

/**
 * 전체 신호 처리 파이프라인
 * 
 * 1. 차동 신호 처리로 공통 모드 노이즈 제거
 * 2. 칼만 필터로 측정 노이즈 감소
 * 
 * @param voltagePairs - [working, reference] 전압 쌍 배열
 * @param kalmanConfig - 칼만 필터 설정 (선택)
 * @returns 처리된 신호 결과
 */
export function processSignalPipeline(
  voltagePairs: [number, number][],
  kalmanConfig?: Partial<KalmanFilterConfig>
): ProcessedSignalResult {
  const log: string[] = [];

  // 1. 차동 신호 처리
  const differentialSignals = processDifferentialSignalBatch(voltagePairs);
  log.push(`Differential signals (${differentialSignals.length} samples): [${differentialSignals.map(v => v.toFixed(4)).join(', ')}]`);

  // 2. 칼만 필터 적용
  const kf = new KalmanFilter1D({
    processNoise: kalmanConfig?.processNoise ?? 0.0001,      // Q: 작은 값 → 안정적인 시스템 가정
    measurementNoise: kalmanConfig?.measurementNoise ?? 0.01, // R: 센서 노이즈 수준
    initialEstimate: differentialSignals[0] ?? 0,
    initialErrorCovariance: kalmanConfig?.initialErrorCovariance ?? 1
  });

  const filteredValues = kf.updateBatch(differentialSignals);
  const filteredValue = filteredValues[filteredValues.length - 1] ?? 0;
  
  log.push(`Kalman filtered values: [${filteredValues.map(v => v.toFixed(4)).join(', ')}]`);
  log.push(`Final filtered value: ${filteredValue.toFixed(4)} V`);

  const filterState = kf.getState();
  log.push(`Kalman gain (K): ${filterState.kalmanGain.toFixed(4)}`);
  log.push(`Error covariance (P): ${filterState.errorCovariance.toFixed(6)}`);

  return {
    differentialSignals,
    filteredValue,
    filterState,
    processingLog: log
  };
}

/* ============================================
 * 4. Concentration Calibration
 * ============================================
 * 전압 → 농도 변환 (선형 캘리브레이션)
 */

export interface CalibrationParams {
  /** 오프셋 전압 (V) */
  offsetVoltage: number;
  /** 감도 (V per mmol/L) */
  sensitivity: number;
}

const DEFAULT_CALIBRATION: CalibrationParams = {
  offsetVoltage: 0.1,  // 베이스라인 전압
  sensitivity: 0.35    // 0.35V per 1 mmol/L
};

/**
 * 전압을 농도로 변환
 * 
 * @param voltage - 필터링된 전압 (V)
 * @param params - 캘리브레이션 파라미터
 * @returns 농도 (mmol/L)
 */
export function voltageToConcentration(
  voltage: number,
  params: CalibrationParams = DEFAULT_CALIBRATION
): number {
  // concentration = (voltage - offset) / sensitivity
  const concentration = (voltage - params.offsetVoltage) / params.sensitivity;
  return Math.max(0, concentration); // 음수 농도 방지
}

/**
 * 농도를 전압으로 변환 (역변환)
 */
export function concentrationToVoltage(
  concentration: number,
  params: CalibrationParams = DEFAULT_CALIBRATION
): number {
  return params.offsetVoltage + params.sensitivity * concentration;
}






