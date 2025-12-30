/**
 * Pattern Recognition Engine
 * 
 * Part 3 Section 4.3: Cross-reactive Pattern Matching
 * "The Brain" - 패턴 인식 및 매칭 알고리즘
 */

import { 
  FingerprintVector, 
  generateFingerprintVector, 
  simulateSensorArray,
  STANDARD_SENSOR_ARRAY
} from "./sensor-array";

/* ============================================
 * 1. Types & Interfaces
 * ============================================
 */

/**
 * 질병/상태 패턴 정의
 */
export interface DiseasePattern {
  id: string;
  name: string;
  nameKo: string;
  category: PatternCategory;
  description: string;
  referenceVector: number[];    // 표준 패턴 벡터
  threshold: number;            // 매칭 임계값 (0-1)
  severity: "low" | "medium" | "high";
  markers: string[];            // 주요 마커
  recommendations: string[];
}

export type PatternCategory = 
  | "disease"       // 질병
  | "food_safety"   // 식품 안전
  | "environment"   // 환경
  | "reference";    // 참조 (정상)

/**
 * 패턴 매칭 결과
 */
export interface PatternMatchResult {
  patternId: string;
  patternName: string;
  patternNameKo: string;
  similarity: number;           // 유사도 (0-1)
  distance: number;             // 거리 (낮을수록 유사)
  isMatch: boolean;             // 임계값 초과 여부
  confidence: "low" | "medium" | "high";
  matchedMarkers: string[];
}

/**
 * 분석 결과
 */
export interface PatternAnalysisResult {
  timestamp: number;
  fingerprint: FingerprintVector;
  matches: PatternMatchResult[];
  topMatch: PatternMatchResult | null;
  overallStatus: "normal" | "warning" | "alert";
  alerts: string[];
}

/* ============================================
 * 2. Standard Disease Pattern Database
 * ============================================
 */

/**
 * 표준 질병 패턴 데이터베이스 (Part 3 Section 4.4)
 */
export const DISEASE_PATTERN_DB: DiseasePattern[] = [
  {
    id: "healthy",
    name: "Healthy Reference",
    nameKo: "정상 참조 패턴",
    category: "reference",
    description: "건강한 상태의 표준 센서 패턴",
    referenceVector: [0.15, 0.12, 0.18, 0.08, 0.20, 0.10, 0.16, 0.14, 0.12, 0.17, 0.25, 0.22, 0.18, 0.15, 0.08, 0.14],
    threshold: 0.90,
    severity: "low",
    markers: [],
    recommendations: ["현재 상태를 유지하세요.", "정기적인 건강 검진을 권장합니다."]
  },
  {
    id: "kidney_disease",
    name: "Kidney Disease Pattern",
    nameKo: "신장 질환 패턴",
    category: "disease",
    description: "호흡에서 암모니아 및 요소 수치 상승 감지",
    referenceVector: [0.20, 0.65, 0.22, 0.15, 0.25, 0.12, 0.20, 0.18, 0.15, 0.22, 0.30, 0.25, 0.55, 0.60, 0.10, 0.18],
    threshold: 0.85,
    severity: "high",
    markers: ["Ammonia", "Urea", "Creatinine"],
    recommendations: [
      "신장 기능 검사를 권장합니다.",
      "전문의 상담이 필요합니다.",
      "수분 섭취를 충분히 하세요."
    ]
  },
  {
    id: "diabetes_ketoacidosis",
    name: "Diabetic Ketoacidosis Pattern",
    nameKo: "당뇨병성 케톤산증 패턴",
    category: "disease",
    description: "호흡에서 아세톤 냄새 및 포도당 수치 이상 감지",
    referenceVector: [0.70, 0.15, 0.25, 0.10, 0.22, 0.08, 0.18, 0.20, 0.16, 0.19, 0.28, 0.65, 0.20, 0.18, 0.12, 0.20],
    threshold: 0.85,
    severity: "high",
    markers: ["Acetone", "Glucose"],
    recommendations: [
      "혈당 수치를 즉시 확인하세요.",
      "당뇨병 전문의 상담이 필요합니다.",
      "케톤 수치 검사를 권장합니다."
    ]
  },
  {
    id: "liver_disease",
    name: "Liver Disease Pattern",
    nameKo: "간 질환 패턴",
    category: "disease",
    description: "호흡에서 황화수소 및 VOC 수치 상승 감지",
    referenceVector: [0.25, 0.20, 0.35, 0.55, 0.30, 0.15, 0.45, 0.40, 0.35, 0.38, 0.32, 0.28, 0.22, 0.20, 0.15, 0.22],
    threshold: 0.85,
    severity: "high",
    markers: ["Hydrogen Sulfide", "Ethanol", "VOC-A", "VOC-B"],
    recommendations: [
      "간 기능 검사를 권장합니다.",
      "알코올 섭취를 자제하세요.",
      "전문의 상담이 필요합니다."
    ]
  },
  {
    id: "spoiled_food",
    name: "Spoiled Food Pattern",
    nameKo: "부패 식품 패턴",
    category: "food_safety",
    description: "식품에서 부패 관련 가스 감지",
    referenceVector: [0.18, 0.55, 0.20, 0.75, 0.28, 0.12, 0.60, 0.55, 0.25, 0.30, 0.35, 0.30, 0.25, 0.22, 0.18, 0.25],
    threshold: 0.80,
    severity: "medium",
    markers: ["Hydrogen Sulfide", "Ammonia", "VOC-A", "VOC-B"],
    recommendations: [
      "해당 식품 섭취를 금지합니다.",
      "식품을 즉시 폐기하세요.",
      "식품 보관 상태를 점검하세요."
    ]
  },
  {
    id: "air_pollution",
    name: "Air Pollution Pattern",
    nameKo: "대기 오염 패턴",
    category: "environment",
    description: "환경에서 유해 가스 감지",
    referenceVector: [0.22, 0.18, 0.20, 0.35, 0.45, 0.55, 0.40, 0.38, 0.42, 0.45, 0.20, 0.18, 0.15, 0.12, 0.25, 0.28],
    threshold: 0.80,
    severity: "medium",
    markers: ["Methane", "Nitrogen Dioxide", "VOC-C", "VOC-D"],
    recommendations: [
      "환기를 즉시 실시하세요.",
      "마스크 착용을 권장합니다.",
      "장시간 노출을 피하세요."
    ]
  }
];

/* ============================================
 * 3. Similarity Algorithms
 * ============================================
 */

/**
 * 코사인 유사도 계산
 * Part 3 Section 4.3.1: Cosine Similarity
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must have the same dimensions");
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * 유클리드 거리 계산
 */
export function euclideanDistance(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must have the same dimensions");
  }
  
  let sumSquares = 0;
  for (let i = 0; i < vectorA.length; i++) {
    const diff = vectorA[i] - vectorB[i];
    sumSquares += diff * diff;
  }
  
  return Math.sqrt(sumSquares);
}

/**
 * K-Nearest Neighbors (KNN) 구현
 * Part 3 Section 4.3.2: KNN Classification
 */
export function knnClassify(
  fingerprint: FingerprintVector,
  patterns: DiseasePattern[],
  k: number = 3
): PatternMatchResult[] {
  // 모든 패턴과의 거리/유사도 계산
  const results: PatternMatchResult[] = patterns.map(pattern => {
    const similarity = cosineSimilarity(fingerprint.values, pattern.referenceVector);
    const distance = euclideanDistance(fingerprint.values, pattern.referenceVector);
    
    // 매칭된 마커 확인
    const matchedMarkers = pattern.markers.filter(marker => 
      fingerprint.dominantChannels.includes(marker)
    );
    
    // 신뢰도 계산
    let confidence: "low" | "medium" | "high";
    if (similarity >= 0.90) confidence = "high";
    else if (similarity >= 0.75) confidence = "medium";
    else confidence = "low";
    
    return {
      patternId: pattern.id,
      patternName: pattern.name,
      patternNameKo: pattern.nameKo,
      similarity,
      distance,
      isMatch: similarity >= pattern.threshold,
      confidence,
      matchedMarkers
    };
  });
  
  // 유사도 기준 내림차순 정렬 후 상위 K개 반환
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

/* ============================================
 * 4. Pattern Recognition Engine
 * ============================================
 */

/**
 * 메인 패턴 분석 함수
 */
export function analyzePattern(fingerprint: FingerprintVector): PatternAnalysisResult {
  const matches = knnClassify(fingerprint, DISEASE_PATTERN_DB, 5);
  
  // 상위 매칭 결과
  const topMatch = matches[0] || null;
  
  // 알림 생성
  const alerts: string[] = [];
  let overallStatus: "normal" | "warning" | "alert" = "normal";
  
  // 85% 이상 유사도로 매칭되는 패턴 확인
  const significantMatches = matches.filter(m => 
    m.isMatch && m.patternId !== "healthy"
  );
  
  if (significantMatches.length > 0) {
    const highestMatch = significantMatches[0];
    
    if (highestMatch.similarity >= 0.90) {
      overallStatus = "alert";
      alerts.push(`⚠️ 높은 유사도 감지: ${highestMatch.patternNameKo} (${(highestMatch.similarity * 100).toFixed(1)}%)`);
    } else if (highestMatch.similarity >= 0.85) {
      overallStatus = "warning";
      alerts.push(`🔶 패턴 매칭: ${highestMatch.patternNameKo} (${(highestMatch.similarity * 100).toFixed(1)}%)`);
    }
    
    // 매칭된 마커 알림
    if (highestMatch.matchedMarkers.length > 0) {
      alerts.push(`주요 반응 채널: ${highestMatch.matchedMarkers.join(", ")}`);
    }
  }
  
  // 정상 패턴과의 유사도 확인
  const healthyMatch = matches.find(m => m.patternId === "healthy");
  if (healthyMatch && healthyMatch.similarity >= 0.85) {
    overallStatus = "normal";
    alerts.push(`✓ 정상 패턴과 높은 유사도 (${(healthyMatch.similarity * 100).toFixed(1)}%)`);
  }
  
  return {
    timestamp: Date.now(),
    fingerprint,
    matches,
    topMatch,
    overallStatus,
    alerts
  };
}

/**
 * 전체 분석 파이프라인 실행
 */
export function runPatternAnalysis(
  pattern?: "healthy" | "kidney" | "diabetes" | "spoiled" | "random"
): PatternAnalysisResult {
  // 1. 센서 어레이 시뮬레이션
  const sensorData = simulateSensorArray(pattern);
  
  // 2. 지문 벡터 생성
  const fingerprint = generateFingerprintVector(sensorData);
  
  // 3. 패턴 분석
  return analyzePattern(fingerprint);
}

/**
 * 패턴 검색
 */
export function getPatternById(id: string): DiseasePattern | undefined {
  return DISEASE_PATTERN_DB.find(p => p.id === id);
}

/**
 * 참조 패턴 가져오기 (레이더 차트용)
 */
export function getHealthyReferenceVector(): number[] {
  const healthy = DISEASE_PATTERN_DB.find(p => p.id === "healthy");
  return healthy?.referenceVector || [];
}

/**
 * 채널 이름 목록 가져오기
 */
export function getChannelNames(): string[] {
  return STANDARD_SENSOR_ARRAY.map(ch => ch.name);
}






