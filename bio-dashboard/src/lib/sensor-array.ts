/**
 * Multi-Dimensional Sensor Array Data Model
 * 
 * Part 3 Section 4: Cross-reactive Sensor Array
 * Electronic Nose & Tongue (비타겟 센싱)
 */

/* ============================================
 * 1. Types & Interfaces
 * ============================================
 */

/**
 * 개별 센서 채널 데이터
 */
export interface SensorChannel {
  id: string;
  name: string;
  value: number;           // Raw sensor value (0-1 normalized)
  baseline: number;        // Baseline value
  sensitivity: number;     // Sensitivity factor
  type: SensorType;
}

/**
 * 센서 타입 (Electronic Nose/Tongue)
 */
export type SensorType = 
  | "metal_oxide"          // 금속 산화물 (가스 감지)
  | "conducting_polymer"   // 전도성 폴리머
  | "piezoelectric"        // 압전 센서
  | "electrochemical"      // 전기화학 센서
  | "optical"              // 광학 센서
  | "capacitive";          // 정전용량 센서

/**
 * 센서 어레이 데이터 (8-16 센서 입력)
 */
export interface SensorArrayData {
  id: string;
  timestamp: number;
  channels: SensorChannel[];
  temperature: number;      // °C
  humidity: number;         // %
  metadata?: {
    sampleType?: string;    // 샘플 유형 (breath, urine, food, etc.)
    duration?: number;      // 측정 시간 (ms)
    notes?: string;
  };
}

/**
 * 지문 벡터 (정규화된 패턴)
 */
export interface FingerprintVector {
  id: string;
  timestamp: number;
  dimensions: number;       // 벡터 차원 수
  values: number[];         // 정규화된 값 배열 (0-1)
  magnitude: number;        // 벡터 크기
  entropy: number;          // 패턴 엔트로피
  dominantChannels: string[]; // 주요 반응 채널
}

/* ============================================
 * 2. Sensor Array Configuration
 * ============================================
 */

/**
 * 표준 16채널 센서 어레이 구성
 * Part 3 Section 4.1: Cross-reactive Array Design
 */
export const STANDARD_SENSOR_ARRAY: Omit<SensorChannel, "value">[] = [
  // Metal Oxide Sensors (6개) - 다양한 가스 감지
  { id: "MOS1", name: "Acetone", baseline: 0.1, sensitivity: 1.2, type: "metal_oxide" },
  { id: "MOS2", name: "Ammonia", baseline: 0.08, sensitivity: 1.5, type: "metal_oxide" },
  { id: "MOS3", name: "Ethanol", baseline: 0.12, sensitivity: 1.1, type: "metal_oxide" },
  { id: "MOS4", name: "Hydrogen Sulfide", baseline: 0.05, sensitivity: 2.0, type: "metal_oxide" },
  { id: "MOS5", name: "Methane", baseline: 0.15, sensitivity: 0.9, type: "metal_oxide" },
  { id: "MOS6", name: "Nitrogen Dioxide", baseline: 0.07, sensitivity: 1.8, type: "metal_oxide" },
  
  // Conducting Polymer Sensors (4개) - 휘발성 유기 화합물
  { id: "CP1", name: "VOC-A", baseline: 0.1, sensitivity: 1.3, type: "conducting_polymer" },
  { id: "CP2", name: "VOC-B", baseline: 0.11, sensitivity: 1.2, type: "conducting_polymer" },
  { id: "CP3", name: "VOC-C", baseline: 0.09, sensitivity: 1.4, type: "conducting_polymer" },
  { id: "CP4", name: "VOC-D", baseline: 0.13, sensitivity: 1.1, type: "conducting_polymer" },
  
  // Electrochemical Sensors (4개) - 특정 바이오마커
  { id: "EC1", name: "Lactate", baseline: 0.2, sensitivity: 1.0, type: "electrochemical" },
  { id: "EC2", name: "Glucose", baseline: 0.18, sensitivity: 1.1, type: "electrochemical" },
  { id: "EC3", name: "Urea", baseline: 0.15, sensitivity: 1.3, type: "electrochemical" },
  { id: "EC4", name: "Creatinine", baseline: 0.12, sensitivity: 1.5, type: "electrochemical" },
  
  // Optical/Capacitive Sensors (2개) - 물리적 특성
  { id: "OPT1", name: "Turbidity", baseline: 0.05, sensitivity: 1.0, type: "optical" },
  { id: "CAP1", name: "Conductivity", baseline: 0.1, sensitivity: 1.2, type: "capacitive" }
];

/* ============================================
 * 3. Fingerprint Vector Generator
 * ============================================
 */

/**
 * 센서 어레이 데이터를 정규화된 지문 벡터로 변환
 * Part 3 Section 4.2: Pattern Normalization
 */
export function generateFingerprintVector(data: SensorArrayData): FingerprintVector {
  const channels = data.channels;
  
  // 1. 베이스라인 보정
  const baselineCorrected = channels.map(ch => {
    const corrected = (ch.value - ch.baseline) * ch.sensitivity;
    return Math.max(0, corrected); // 음수 방지
  });
  
  // 2. Min-Max 정규화 (0-1 범위)
  const min = Math.min(...baselineCorrected);
  const max = Math.max(...baselineCorrected);
  const range = max - min || 1; // 0으로 나누기 방지
  
  const normalized = baselineCorrected.map(v => (v - min) / range);
  
  // 3. 벡터 크기 계산 (Euclidean norm)
  const magnitude = Math.sqrt(normalized.reduce((sum, v) => sum + v * v, 0));
  
  // 4. 엔트로피 계산 (패턴 복잡도)
  const total = normalized.reduce((sum, v) => sum + v, 0) || 1;
  const probabilities = normalized.map(v => v / total);
  const entropy = -probabilities.reduce((sum, p) => {
    if (p > 0) return sum + p * Math.log2(p);
    return sum;
  }, 0);
  
  // 5. 주요 반응 채널 식별 (상위 25%)
  const threshold = 0.75;
  const dominantChannels = channels
    .filter((ch, i) => normalized[i] >= threshold)
    .map(ch => ch.name);
  
  return {
    id: `fp-${data.id}`,
    timestamp: data.timestamp,
    dimensions: normalized.length,
    values: normalized,
    magnitude,
    entropy,
    dominantChannels
  };
}

/**
 * 센서 어레이 시뮬레이션 (모킹)
 */
export function simulateSensorArray(
  pattern?: "healthy" | "kidney" | "diabetes" | "spoiled" | "random",
  noise: number = 0.1
): SensorArrayData {
  const channels: SensorChannel[] = STANDARD_SENSOR_ARRAY.map(config => {
    let value = config.baseline;
    
    // 패턴에 따른 값 조정
    switch (pattern) {
      case "healthy":
        value = config.baseline + (Math.random() * 0.1);
        break;
      case "kidney":
        // 신장 질환: Ammonia, Urea, Creatinine 상승
        if (["Ammonia", "Urea", "Creatinine"].includes(config.name)) {
          value = config.baseline + 0.4 + (Math.random() * 0.2);
        } else {
          value = config.baseline + (Math.random() * 0.15);
        }
        break;
      case "diabetes":
        // 당뇨: Acetone, Glucose 상승
        if (["Acetone", "Glucose"].includes(config.name)) {
          value = config.baseline + 0.5 + (Math.random() * 0.2);
        } else {
          value = config.baseline + (Math.random() * 0.12);
        }
        break;
      case "spoiled":
        // 부패: Hydrogen Sulfide, Ammonia, VOC 상승
        if (["Hydrogen Sulfide", "Ammonia", "VOC-A", "VOC-B"].includes(config.name)) {
          value = config.baseline + 0.6 + (Math.random() * 0.3);
        } else {
          value = config.baseline + (Math.random() * 0.1);
        }
        break;
      case "random":
      default:
        value = config.baseline + (Math.random() * 0.5);
    }
    
    // 노이즈 추가
    value += (Math.random() - 0.5) * noise;
    value = Math.max(0, Math.min(1, value)); // 0-1 범위로 클램핑
    
    return {
      ...config,
      value
    };
  });
  
  return {
    id: `arr-${Date.now()}`,
    timestamp: Date.now(),
    channels,
    temperature: 25 + Math.random() * 10,
    humidity: 40 + Math.random() * 30,
    metadata: {
      sampleType: pattern || "unknown",
      duration: 1000 + Math.random() * 500
    }
  };
}

/**
 * 레이더 차트용 데이터 변환
 */
export function toRadarChartData(
  fingerprint: FingerprintVector,
  channelNames: string[]
): { subject: string; value: number; fullMark: number }[] {
  return fingerprint.values.map((value, i) => ({
    subject: channelNames[i] || `CH${i + 1}`,
    value: Number((value * 100).toFixed(1)),
    fullMark: 100
  }));
}

/**
 * 참조 패턴과 비교용 데이터 생성
 */
export function toRadarChartComparisonData(
  current: FingerprintVector,
  reference: FingerprintVector,
  channelNames: string[]
): { subject: string; current: number; reference: number; fullMark: number }[] {
  return current.values.map((value, i) => ({
    subject: channelNames[i] || `CH${i + 1}`,
    current: Number((value * 100).toFixed(1)),
    reference: Number(((reference.values[i] || 0) * 100).toFixed(1)),
    fullMark: 100
  }));
}






