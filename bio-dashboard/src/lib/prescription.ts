/**
 * E-Prescription & Pharmacy Routing System
 * 
 * 전자 처방전 및 약국 연동 시스템
 */

import { generateHashChain } from "./security";
import { getCartManager, productsDB } from "./mall";

/* ============================================
 * 1. Types & Interfaces
 * ============================================
 */

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  
  // Doctor Info
  doctorId: string;
  doctorName: string;
  doctorLicense: string;
  hospitalName: string;
  
  // Diagnosis
  diagnosisCode: string;        // ICD-10 Code
  diagnosisName: string;
  diagnosisNameKo: string;
  
  // Medications
  medications: Medication[];
  
  // Meta
  prescribedAt: number;
  validUntil: number;           // 처방전 유효기간
  status: PrescriptionStatus;
  
  // Security
  digitalSignature: string;     // Hash-based signature
  signatureChain: string[];     // Hash chain for verification
  
  // Pharmacy
  selectedPharmacyId?: string;
  pickupCode?: string;
  sentToPharmacyAt?: number;
}

export interface Medication {
  id: string;
  name: string;
  nameKo: string;
  genericName: string;
  dosage: string;               // e.g., "500mg"
  frequency: string;            // e.g., "1일 3회"
  duration: string;             // e.g., "7일분"
  quantity: number;             // 총 수량
  instructions: string;         // 복용 지침
  warnings?: string[];          // 주의사항
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number;             // km
  rating: number;
  reviewCount: number;
  hours: string;
  isOpen: boolean;
  hasDelivery: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type PrescriptionStatus = 
  | "created"
  | "signed"
  | "sent_to_pharmacy"
  | "ready_for_pickup"
  | "completed"
  | "expired";

/* ============================================
 * 2. Constants - ICD-10 Codes
 * ============================================
 */

export const ICD10_CODES: Record<string, { name: string; nameKo: string }> = {
  "E11.9": { name: "Type 2 diabetes mellitus without complications", nameKo: "2형 당뇨병" },
  "N18.3": { name: "Chronic kidney disease, stage 3", nameKo: "만성 신장질환 3기" },
  "I10": { name: "Essential (primary) hypertension", nameKo: "본태성 고혈압" },
  "J06.9": { name: "Acute upper respiratory infection, unspecified", nameKo: "급성 상기도 감염" },
  "K21.0": { name: "Gastro-esophageal reflux disease with esophagitis", nameKo: "위식도 역류질환" },
  "M54.5": { name: "Low back pain", nameKo: "요통" },
  "F32.9": { name: "Major depressive disorder, single episode, unspecified", nameKo: "주요 우울장애" },
  "G43.9": { name: "Migraine, unspecified", nameKo: "편두통" }
};

/* ============================================
 * 3. Mock Data - Medications
 * ============================================
 */

export const MOCK_MEDICATIONS: Record<string, Medication[]> = {
  "E11.9": [
    {
      id: "med-001",
      name: "Metformin",
      nameKo: "메트포르민",
      genericName: "Metformin HCl",
      dosage: "500mg",
      frequency: "1일 2회 (아침, 저녁 식후)",
      duration: "30일분",
      quantity: 60,
      instructions: "식사 직후 복용하세요. 충분한 물과 함께 복용하세요.",
      warnings: ["알코올 섭취 자제", "신장 기능 모니터링 필요"]
    },
    {
      id: "med-002",
      name: "Glimepiride",
      nameKo: "글리메피리드",
      genericName: "Glimepiride",
      dosage: "2mg",
      frequency: "1일 1회 (아침 식전)",
      duration: "30일분",
      quantity: 30,
      instructions: "아침 식사 직전에 복용하세요.",
      warnings: ["저혈당 주의", "운전 시 주의"]
    }
  ],
  "N18.3": [
    {
      id: "med-003",
      name: "Losartan",
      nameKo: "로사르탄",
      genericName: "Losartan Potassium",
      dosage: "50mg",
      frequency: "1일 1회",
      duration: "30일분",
      quantity: 30,
      instructions: "매일 같은 시간에 복용하세요.",
      warnings: ["고칼륨혈증 주의", "임산부 금기"]
    }
  ],
  "I10": [
    {
      id: "med-004",
      name: "Amlodipine",
      nameKo: "암로디핀",
      genericName: "Amlodipine Besylate",
      dosage: "5mg",
      frequency: "1일 1회",
      duration: "30일분",
      quantity: 30,
      instructions: "매일 같은 시간에 복용하세요.",
      warnings: ["부종 발생 시 의사와 상담"]
    }
  ],
  "J06.9": [
    {
      id: "med-005",
      name: "Acetaminophen",
      nameKo: "아세트아미노펜",
      genericName: "Paracetamol",
      dosage: "500mg",
      frequency: "1일 3회 (필요시)",
      duration: "5일분",
      quantity: 15,
      instructions: "통증이나 발열 시 복용하세요. 하루 4g을 초과하지 마세요.",
      warnings: ["간 질환자 주의", "음주 시 복용 금지"]
    },
    {
      id: "med-006",
      name: "Dextromethorphan",
      nameKo: "덱스트로메토르판",
      genericName: "Dextromethorphan HBr",
      dosage: "15mg",
      frequency: "1일 3회",
      duration: "5일분",
      quantity: 15,
      instructions: "기침이 심할 때 복용하세요.",
      warnings: ["졸음 유발 가능"]
    }
  ],
  "default": [
    {
      id: "med-default",
      name: "Multivitamin",
      nameKo: "종합비타민",
      genericName: "Multivitamin Complex",
      dosage: "1정",
      frequency: "1일 1회",
      duration: "30일분",
      quantity: 30,
      instructions: "아침 식사 후 복용하세요.",
      warnings: []
    }
  ]
};

/* ============================================
 * 4. Mock Data - Pharmacies
 * ============================================
 */

export const MOCK_PHARMACIES: Pharmacy[] = [
  {
    id: "pharm-001",
    name: "종로대학약국",
    address: "서울특별시 종로구 대학로 102",
    phone: "02-742-1234",
    distance: 0.3,
    rating: 4.8,
    reviewCount: 328,
    hours: "09:00 - 21:00",
    isOpen: true,
    hasDelivery: true,
    coordinates: { lat: 37.5800, lng: 127.0000 }
  },
  {
    id: "pharm-002",
    name: "연세온누리약국",
    address: "서울특별시 종로구 대명길 15",
    phone: "02-765-5678",
    distance: 0.5,
    rating: 4.6,
    reviewCount: 215,
    hours: "08:30 - 22:00",
    isOpen: true,
    hasDelivery: true,
    coordinates: { lat: 37.5790, lng: 127.0010 }
  },
  {
    id: "pharm-003",
    name: "해오름약국",
    address: "서울특별시 종로구 혜화로 28",
    phone: "02-741-9012",
    distance: 0.8,
    rating: 4.9,
    reviewCount: 456,
    hours: "09:00 - 20:00",
    isOpen: true,
    hasDelivery: false,
    coordinates: { lat: 37.5815, lng: 126.9990 }
  },
  {
    id: "pharm-004",
    name: "24시 메디팜약국",
    address: "서울특별시 종로구 동숭길 45",
    phone: "02-763-2424",
    distance: 1.2,
    rating: 4.4,
    reviewCount: 189,
    hours: "24시간",
    isOpen: true,
    hasDelivery: true,
    coordinates: { lat: 37.5825, lng: 127.0020 }
  },
  {
    id: "pharm-005",
    name: "건강한약국",
    address: "서울특별시 종로구 창경궁로 112",
    phone: "02-745-6789",
    distance: 1.5,
    rating: 4.5,
    reviewCount: 267,
    hours: "09:00 - 19:00",
    isOpen: false,
    hasDelivery: false,
    coordinates: { lat: 37.5780, lng: 127.0030 }
  }
];

/* ============================================
 * 5. Prescription Service Functions
 * ============================================
 */

/**
 * 디지털 서명 생성 (Hash Chain 기반)
 */
export function generateDigitalSignature(prescription: Omit<Prescription, "digitalSignature" | "signatureChain">): {
  signature: string;
  chain: string[];
} {
  // 처방전 핵심 데이터를 해시 체인으로 연결
  const dataElements = [
    prescription.id,
    prescription.doctorId,
    prescription.doctorLicense,
    prescription.patientId,
    prescription.diagnosisCode,
    prescription.medications.map(m => m.id).join(","),
    prescription.prescribedAt.toString()
  ];
  
  // Hash chain 생성 - 각 데이터 요소를 순차적으로 해시
  const chain: string[] = [];
  let prevHash = "GENESIS";
  
  for (const data of dataElements) {
    const hash = generateHashChain(prevHash, data);
    chain.push(hash);
    prevHash = hash;
  }
  
  // 최종 서명 = 마지막 해시
  const signature = chain[chain.length - 1];
  
  return { signature, chain };
}

/**
 * 처방전 생성
 */
export function createPrescription(
  appointmentId: string,
  patientId: string,
  patientName: string,
  doctorId: string,
  doctorName: string,
  doctorLicense: string,
  hospitalName: string,
  diagnosisCode: string
): Prescription {
  const diagnosis = ICD10_CODES[diagnosisCode] || { 
    name: "General consultation", 
    nameKo: "일반 상담" 
  };
  
  const medications = MOCK_MEDICATIONS[diagnosisCode] || MOCK_MEDICATIONS["default"];
  
  const now = Date.now();
  const validDays = 3; // 처방전 유효기간 3일
  
  const prescriptionBase = {
    id: `RX-${now.toString(36).toUpperCase()}`,
    appointmentId,
    patientId,
    patientName,
    doctorId,
    doctorName,
    doctorLicense: doctorLicense || `MD-${doctorId.slice(-6).toUpperCase()}`,
    hospitalName,
    diagnosisCode,
    diagnosisName: diagnosis.name,
    diagnosisNameKo: diagnosis.nameKo,
    medications,
    prescribedAt: now,
    validUntil: now + (validDays * 24 * 60 * 60 * 1000),
    status: "created" as PrescriptionStatus
  };
  
  const { signature, chain } = generateDigitalSignature(prescriptionBase);
  
  return {
    ...prescriptionBase,
    digitalSignature: signature,
    signatureChain: chain,
    status: "signed"
  };
}

/**
 * 픽업 코드 생성 (6자리)
 */
export function generatePickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동 가능 문자 제외
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 약국으로 처방전 전송
 */
export function sendToPharmacy(
  prescription: Prescription,
  pharmacyId: string
): Prescription {
  const pickupCode = generatePickupCode();
  
  return {
    ...prescription,
    selectedPharmacyId: pharmacyId,
    pickupCode,
    sentToPharmacyAt: Date.now(),
    status: "sent_to_pharmacy"
  };
}

/**
 * 약국 검색 (거리순 또는 평점순)
 */
export function searchPharmacies(
  sortBy: "distance" | "rating" = "distance"
): Pharmacy[] {
  const sorted = [...MOCK_PHARMACIES].sort((a, b) => {
    if (sortBy === "distance") return a.distance - b.distance;
    return b.rating - a.rating;
  });
  
  return sorted;
}

/**
 * 약국 조회
 */
export function getPharmacyById(id: string): Pharmacy | undefined {
  return MOCK_PHARMACIES.find(p => p.id === id);
}

/**
 * QR 코드 데이터 생성
 */
export function generateQRCodeData(prescription: Prescription): string {
  return JSON.stringify({
    code: prescription.pickupCode,
    rxId: prescription.id,
    pharmacy: prescription.selectedPharmacyId,
    validUntil: prescription.validUntil,
    signature: prescription.digitalSignature.slice(0, 16)
  });
}

/**
 * 처방전 상태 업데이트
 */
export function updatePrescriptionStatus(
  prescription: Prescription,
  status: PrescriptionStatus
): Prescription {
  return {
    ...prescription,
    status
  };
}

/**
 * 처방전 유효성 검증
 */
export function validatePrescription(prescription: Prescription): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!prescription.digitalSignature) {
    errors.push("디지털 서명이 없습니다.");
  }
  
  if (Date.now() > prescription.validUntil) {
    errors.push("처방전 유효기간이 만료되었습니다.");
  }
  
  if (prescription.medications.length === 0) {
    errors.push("처방 약품이 없습니다.");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/* ============================================
 * 7. One-Click Prescription to Cart
 * ============================================
 */

/**
 * Medical Food 매핑: ICD-10 진단 코드 → 제품 ID
 */
const MEDICAL_FOOD_MAPPINGS: Record<string, string[]> = {
  "E11.9": ["prod-007", "prod-013"],     // 당뇨 → Diabetic Care Meal, Glucose Control Formula
  "E78.0": ["prod-002", "prod-006"],     // 고지혈증 → Omega-3, CoQ10
  "N18.9": ["prod-014"],                  // 신장질환 → Kidney Support
  "F32.9": ["prod-003", "prod-005"],     // 우울증 → Magnesium, Ashwagandha
  "G47.0": ["prod-003", "prod-004"],     // 불면증 → Magnesium, Tart Cherry
};

/**
 * 처방전 기반 Medical Food 자동 추가
 * 
 * @param prescription - 전자 처방전
 * @param doctorName - 처방 의사 이름
 * @returns 장바구니에 추가된 제품 ID 목록
 */
export function addPrescribedMedicalFoodsToCart(
  prescription: Prescription
): { addedProductIds: string[]; message: string } {
  const addedProductIds: string[] = [];
  
  // Get recommended products based on diagnosis code
  const recommendedProductIds = MEDICAL_FOOD_MAPPINGS[prescription.diagnosisCode] || [];
  
  if (recommendedProductIds.length === 0) {
    return {
      addedProductIds: [],
      message: "해당 진단에 대한 추천 의료용 식품이 없습니다."
    };
  }
  
  // Add to cart
  const cartManager = getCartManager();
  
  for (const productId of recommendedProductIds) {
    const product = productsDB.find(p => p.id === productId);
    if (product) {
      cartManager.addItem(product, 1, {
        prescriptionId: prescription.id,
        doctorName: prescription.doctorName
      });
      addedProductIds.push(productId);
    }
  }
  
  const message = addedProductIds.length > 0
    ? `${prescription.doctorName} 선생님이 처방한 ${addedProductIds.length}개의 건강식품이 장바구니에 추가되었습니다.`
    : "처방된 건강식품을 찾을 수 없습니다.";
  
  return { addedProductIds, message };
}

/**
 * 처방전에서 추천 가능한 Medical Food 목록 조회
 */
export function getRecommendedMedicalFoods(diagnosisCode: string): typeof productsDB {
  const productIds = MEDICAL_FOOD_MAPPINGS[diagnosisCode] || [];
  return productsDB.filter(p => productIds.includes(p.id));
}

