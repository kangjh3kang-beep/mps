/**
 * Cartridge Management System
 * 
 * Part 4: Cartridge Manufacturing & QC
 * Part 4 Section 9.3: Factory QC Database Integration
 */

/* ============================================
 * 1. Types & Interfaces
 * ============================================
 */

export type CartridgeStatus = 
  | "valid"           // 사용 가능
  | "used"            // 이미 사용됨 (single-use)
  | "expired"         // 유효기간 만료
  | "qc_failed"       // QC 검증 실패
  | "not_found"       // DB에 없음
  | "unknown";        // 미인증

export interface CartridgeQCData {
  lotNumber: string;
  batchId: string;
  manufacturingDate: string;      // ISO date
  expirationDate: string;         // ISO date
  sensitivity: number;            // mV/mmol·L⁻¹
  sensitivityMin: number;         // 허용 최소값
  sensitivityMax: number;         // 허용 최대값
  baselineOffset: number;         // mV
  calibrationCode: string;        // 배치별 보정 코드
  qcPassedAt: string;             // QC 통과 시간
  qcOperator: string;             // QC 담당자
  /** Hydrogel cartridges: intrinsic gel impedance measured at factory (Ohms @ 1kHz) */
  gelIntrinsicImpedanceOhm?: number;
}

export interface CartridgeInfo {
  id: string;                     // 고유 ID (QR/NFC로 스캔)
  qcData: CartridgeQCData;
  status: CartridgeStatus;
  usageCount: number;             // 사용 횟수
  maxUsageCount: number;          // 최대 사용 횟수 (1 = single-use)
  lastUsedAt: number | null;      // 마지막 사용 시간
  registeredAt: number;           // 등록 시간
  /** Digital twin: when the cartridge seal is first opened/registered */
  openedAt: number;
}

export interface CalibrationParameters {
  sensitivityFactor: number;      // 감도 보정 계수
  offsetCorrection: number;       // 오프셋 보정값 (mV)
  temperatureCoefficient: number; // 온도 보정 계수
  batchCode: string;
  /**
   * Optional metadata from Multi-Path Calibration System
   * - precision: "low" means Universal fallback applied
   * - uncertaintyPct: suggested relative uncertainty for UI display (±)
   * - source: NFC / QR / CLOUD / UNIVERSAL
   * - offlineFallback: true if universal coefficients applied due to offline cloud lookup
   */
  precision?: "high" | "low";
  uncertaintyPct?: number;
  source?: "NFC" | "QR" | "CLOUD" | "UNIVERSAL";
  offlineFallback?: boolean;
  /** Hydrogel cartridges: intrinsic gel impedance (Ohms @ 1kHz) */
  gelIntrinsicImpedanceOhm?: number;
}

export interface CartridgeScanResult {
  success: boolean;
  cartridge: CartridgeInfo | null;
  calibration: CalibrationParameters | null;
  message: string;
  errors: string[];
}

/* ============================================
 * 2. Mock Factory QC Database
 * ============================================
 * Part 4 Section 9.3: 공장 QC 데이터베이스 시뮬레이션
 */

const MOCK_QC_DATABASE: Record<string, CartridgeQCData> = {
  "CTG-2024-001-A001": {
    lotNumber: "LOT-2024-001",
    batchId: "BATCH-A001",
    manufacturingDate: "2024-06-15",
    expirationDate: "2026-06-15",   // 2026년까지 유효
    sensitivity: 35.2,              // mV/mmol·L⁻¹
    sensitivityMin: 30.0,
    sensitivityMax: 40.0,
    baselineOffset: 12.5,
    calibrationCode: "CAL-A001-V1",
    gelIntrinsicImpedanceOhm: 8200,
    qcPassedAt: "2024-06-16T09:30:00Z",
    qcOperator: "QC-OP-001"
  },
  "CTG-2024-001-A002": {
    lotNumber: "LOT-2024-001",
    batchId: "BATCH-A002",
    manufacturingDate: "2024-06-15",
    expirationDate: "2026-06-15",   // 2026년까지 유효
    sensitivity: 34.8,
    sensitivityMin: 30.0,
    sensitivityMax: 40.0,
    baselineOffset: 11.8,
    calibrationCode: "CAL-A002-V1",
    gelIntrinsicImpedanceOhm: 7900,
    qcPassedAt: "2024-06-16T10:15:00Z",
    qcOperator: "QC-OP-001"
  },
  "CTG-2024-002-B001": {
    lotNumber: "LOT-2024-002",
    batchId: "BATCH-B001",
    manufacturingDate: "2024-08-20",
    expirationDate: "2026-08-20",   // 2026년까지 유효
    sensitivity: 36.1,
    sensitivityMin: 30.0,
    sensitivityMax: 40.0,
    baselineOffset: 13.2,
    calibrationCode: "CAL-B001-V1",
    gelIntrinsicImpedanceOhm: 9100,
    qcPassedAt: "2024-08-21T14:00:00Z",
    qcOperator: "QC-OP-002"
  },
  "CTG-EXPIRED-001": {
    lotNumber: "LOT-2023-001",
    batchId: "BATCH-OLD",
    manufacturingDate: "2023-01-01",
    expirationDate: "2024-01-01",  // 만료됨
    sensitivity: 33.5,
    sensitivityMin: 30.0,
    sensitivityMax: 40.0,
    baselineOffset: 10.0,
    calibrationCode: "CAL-OLD-V1",
    qcPassedAt: "2023-01-02T09:00:00Z",
    qcOperator: "QC-OP-003"
  },
  "CTG-QC-FAIL-001": {
    lotNumber: "LOT-2024-003",
    batchId: "BATCH-FAIL",
    manufacturingDate: "2024-09-01",
    expirationDate: "2025-09-01",
    sensitivity: 45.0,              // 범위 초과!
    sensitivityMin: 30.0,
    sensitivityMax: 40.0,
    baselineOffset: 15.0,
    calibrationCode: "CAL-FAIL-V1",
    qcPassedAt: "2024-09-02T09:00:00Z",
    qcOperator: "QC-OP-001"
  },
  "CTG-DEMO-001": {
    lotNumber: "LOT-DEMO",
    batchId: "BATCH-DEMO",
    manufacturingDate: "2024-12-01",
    expirationDate: "2026-12-01",  // 2026년까지 유효
    sensitivity: 35.0,
    sensitivityMin: 30.0,
    sensitivityMax: 40.0,
    baselineOffset: 12.0,
    calibrationCode: "CAL-DEMO-V1",
    gelIntrinsicImpedanceOhm: 8500,
    qcPassedAt: "2024-12-02T09:00:00Z",
    qcOperator: "QC-OP-DEMO"
  }
};

/* ============================================
 * 3. Cartridge Registry (Inventory)
 * ============================================
 */

class CartridgeRegistry {
  private cartridges: Map<string, CartridgeInfo> = new Map();
  private usageHistory: { cartridgeId: string; timestamp: number; action: string }[] = [];

  /**
   * QR/NFC 스캔 및 인증
   */
  scanAndAuthenticate(scannedId: string): CartridgeScanResult {
    const errors: string[] = [];
    
    // 1. 이미 등록된 카트리지 확인
    const existing = this.cartridges.get(scannedId);
    if (existing) {
      // Single-use 체크
      if (existing.usageCount >= existing.maxUsageCount) {
    return {
          success: false,
          cartridge: existing,
          calibration: null,
          message: "🔒 Safety Lock: 이 카트리지는 이미 사용되었습니다. 재사용 불가.",
          errors: ["Cartridge already used (single-use limit reached)"]
        };
      }
      
      // 유효한 경우 캘리브레이션 정보 반환
      const calibration = this.getCalibrationParameters(existing.qcData);
      return {
        success: true,
        cartridge: existing,
        calibration,
        message: `✓ 카트리지 인증됨 (${existing.usageCount}/${existing.maxUsageCount} 사용)`,
        errors: []
      };
    }

    // 2. QC 데이터베이스에서 조회
    const qcData = MOCK_QC_DATABASE[scannedId];
    if (!qcData) {
    return {
        success: false,
      cartridge: null,
        calibration: null,
        message: "❌ 카트리지를 찾을 수 없습니다. 정품인지 확인해주세요.",
        errors: ["Cartridge not found in QC database"]
      };
    }

    // 3. 유효기간 확인
    const now = new Date();
    const expirationDate = new Date(qcData.expirationDate);
    if (now > expirationDate) {
      const cartridgeInfo = this.createCartridgeInfo(scannedId, qcData, "expired");
      this.cartridges.set(scannedId, cartridgeInfo);
      return {
        success: false,
        cartridge: cartridgeInfo,
        calibration: null,
        message: `❌ 카트리지 유효기간 만료 (${qcData.expirationDate})`,
        errors: [`Expired on ${qcData.expirationDate}`]
      };
    }

    // 4. QC 데이터 검증 (감도 범위)
    if (qcData.sensitivity < qcData.sensitivityMin || qcData.sensitivity > qcData.sensitivityMax) {
      const cartridgeInfo = this.createCartridgeInfo(scannedId, qcData, "qc_failed");
      this.cartridges.set(scannedId, cartridgeInfo);
      errors.push(`Sensitivity out of range: ${qcData.sensitivity} (expected ${qcData.sensitivityMin}-${qcData.sensitivityMax})`);
      return {
        success: false,
        cartridge: cartridgeInfo,
        calibration: null,
        message: `❌ QC 검증 실패: 감도가 허용 범위를 벗어났습니다.`,
        errors
      };
    }

    // 5. 유효한 카트리지 등록
    const cartridgeInfo = this.createCartridgeInfo(scannedId, qcData, "valid");
    this.cartridges.set(scannedId, cartridgeInfo);
    
    this.usageHistory.push({
      cartridgeId: scannedId,
      timestamp: Date.now(),
      action: "registered"
    });

    const calibration = this.getCalibrationParameters(qcData);
    
    return {
      success: true,
      cartridge: cartridgeInfo,
      calibration,
      message: `✓ 카트리지 인증 성공! Lot: ${qcData.lotNumber}, 보정코드: ${qcData.calibrationCode}`,
      errors: []
    };
  }

  /**
   * 카트리지 사용 기록 (측정 시)
   */
  recordUsage(
    cartridgeId: string,
    opts?: { testType?: "sweat" | "blood" | "gas" | "bio"; wearFactor?: number }
  ): {
    success: boolean; 
    remaining: number; 
    message: string 
  } {
    const cartridge = this.cartridges.get(cartridgeId);
    if (!cartridge) {
      return { success: false, remaining: 0, message: "카트리지가 등록되지 않았습니다." };
    }

    if (cartridge.status !== "valid") {
      return { success: false, remaining: 0, message: `카트리지 상태 오류: ${cartridge.status}` };
    }

    if (cartridge.usageCount >= cartridge.maxUsageCount) {
      return { success: false, remaining: 0, message: "🔒 Safety Lock: 사용 한도 초과" };
    }

    // 사용 횟수 증가
    cartridge.usageCount++;
    cartridge.lastUsedAt = Date.now();

    // If we've reached usage limit, mark used
    if (cartridge.usageCount >= cartridge.maxUsageCount) {
      cartridge.status = "used";
    }

    this.usageHistory.push({
      cartridgeId,
      timestamp: Date.now(),
      action: "used"
    });

    const remaining = cartridge.maxUsageCount - cartridge.usageCount;
  return {
      success: true,
      remaining,
      message: remaining > 0 
        ? `측정 완료. 남은 사용 횟수: ${remaining}`
        : "🔒 카트리지 사용 완료. 다음 측정 시 새 카트리지를 사용해주세요."
    };
  }

  /**
   * 현재 활성 카트리지 조회
   */
  getActiveCartridge(): CartridgeInfo | null {
    for (const cartridge of this.cartridges.values()) {
      if (cartridge.status === "valid") {
        return cartridge;
      }
    }
    return null;
  }

  /**
   * 카트리지 정보 생성
   */
  private createCartridgeInfo(
    id: string, 
    qcData: CartridgeQCData, 
    status: CartridgeStatus
  ): CartridgeInfo {
    // Reuse-oriented default capacity (patent: maximize reuse)
    // Demo defaults: 15 uses for valid cartridges; still enforced by safety lock when depleted.
    const maxUsageCount = status === "valid" ? 15 : 1;
    const now = Date.now();
    return {
      id,
      qcData,
      status,
      usageCount: 0,
      maxUsageCount,
      lastUsedAt: null,
      registeredAt: now,
      openedAt: now
    };
  }

  /**
   * QC 데이터에서 캘리브레이션 파라미터 추출
   */
  private getCalibrationParameters(qcData: CartridgeQCData): CalibrationParameters {
    // 표준 감도 대비 보정 계수 계산
    const standardSensitivity = 35.0; // 표준 감도 (mV/mmol·L⁻¹)
    const sensitivityFactor = qcData.sensitivity / standardSensitivity;

  return {
      sensitivityFactor,
      offsetCorrection: qcData.baselineOffset,
      temperatureCoefficient: 0.02, // 2%/°C (일반적인 값)
      batchCode: qcData.calibrationCode
  };
}

/**
   * 인벤토리 현황
 */
  getInventoryStatus(): {
  total: number;
  available: number;
  used: number;
  expired: number;
    qcFailed: number;
  } {
    let available = 0, used = 0, expired = 0, qcFailed = 0;
    
    for (const cartridge of this.cartridges.values()) {
      switch (cartridge.status) {
        case "valid": available++; break;
        case "used": used++; break;
        case "expired": expired++; break;
        case "qc_failed": qcFailed++; break;
    }
  }

  return {
      total: this.cartridges.size,
    available,
    used,
    expired,
      qcFailed
  };
}

/**
   * 사용 이력 조회
   */
  getUsageHistory(limit = 10) {
    return this.usageHistory.slice(-limit);
  }

  /**
   * 특정 카트리지 조회
   */
  getCartridge(id: string): CartridgeInfo | undefined {
    return this.cartridges.get(id);
  }

  /**
   * 데모용: 카트리지 초기화
   */
  reset(): void {
    this.cartridges.clear();
    this.usageHistory = [];
  }
}

// 싱글톤 인스턴스
export const cartridgeRegistry = new CartridgeRegistry();

/* ============================================
 * 4. Calibration Application
 * ============================================
 */

/**
 * 캘리브레이션 적용하여 전압값 보정
 */
export function applyCalibration(
  rawVoltage: number,
  calibration: CalibrationParameters,
  temperature: number = 25  // 기본 온도 25°C
): number {
  // 1. 온도 보정
  const tempDelta = temperature - 25;
  const tempFactor = 1 + (calibration.temperatureCoefficient * tempDelta);
  
  // 2. 오프셋 보정 (mV → V 변환)
  const offsetV = calibration.offsetCorrection / 1000;
  
  // 3. 감도 보정
  const correctedVoltage = (rawVoltage - offsetV) / calibration.sensitivityFactor * tempFactor;
  
  return correctedVoltage;
}

/**
 * 사용 가능한 데모 카트리지 ID 목록
 */
export const DEMO_CARTRIDGE_IDS = [
  "CTG-DEMO-001",         // 정상
  "CTG-2024-001-A001",    // 정상
  "CTG-2024-001-A002",    // 정상
  "CTG-2024-002-B001",    // 정상
  "CTG-EXPIRED-001",      // 만료됨
  "CTG-QC-FAIL-001"       // QC 실패
];
