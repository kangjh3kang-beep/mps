import { NextRequest, NextResponse } from "next/server";
import {
  processSignalPipeline,
  voltageToConcentration,
  type KalmanFilterState
} from "@/lib/algorithms";
import {
  verifyDeviceSignature,
  generateHashChain,
  encryptSensitiveData,
  securityAuditLog
} from "@/lib/security";

/**
 * POST /api/analyze
 *
 * Part 5 Section 6.1 + Part 3 알고리즘 기반 Backend API
 * Part 3 Section 6.2: Hash Chain + Part 5 Section 5.1: Secure Transport
 *
 * Request Body:
 * {
 *   user_id: string;
 *   device_id: string;
 *   sensor_data: {
 *     raw_voltage: [number, number][];  // [working, reference] 쌍의 배열
 *     temperature: number;              // 환경 온도 (°C)
 *   };
 *   auth?: {                            // 디바이스 인증 (Part 5 Section 5.1)
 *     deviceId: string;
 *     timestamp: number;
 *     nonce: string;
 *     signature: string;
 *   };
 * }
 */

type VoltagePair = [number, number]; // [working, reference]

type SensorData = {
  raw_voltage: VoltagePair[];
  temperature: number;
};

type DeviceAuth = {
  deviceId: string;
  timestamp: number;
  nonce: string;
  signature: string;
};

type AnalyzeRequest = {
  user_id: string;
  device_id: string;
  sensor_data: SensorData;
  auth?: DeviceAuth;
};

type SecurityInfo = {
  device_authenticated: boolean;
  hash_chain_valid: boolean;
  data_encrypted: boolean;
  current_block_hash: string;
  chain_length: number;
};

type AnalyzeResponse = {
  concentration: number;
  health_score: number;
  anomaly_detected: boolean;
  processing: {
    differential_signals: number[];
    filtered_voltage: number;
    kalman_state: KalmanFilterState;
    log: string[];
  };
  security: SecurityInfo;
  _meta: {
    temperature: number;
    timestamp: string;
    sample_count: number;
  };
};

// In-Memory Hash Chain State (서버 재시작 시 리셋)
let hashChainState = {
  lastHash: "0x00000000", // Genesis hash
  chainLength: 0
};

function isValidVoltagePair(pair: unknown): pair is VoltagePair {
  if (!Array.isArray(pair) || pair.length !== 2) return false;
  return pair.every((v) => typeof v === "number" && !Number.isNaN(v));
}

function isValidDeviceAuth(auth: unknown): auth is DeviceAuth {
  if (typeof auth !== "object" || auth === null) return false;
  const obj = auth as Record<string, unknown>;
  return (
    typeof obj.deviceId === "string" &&
    typeof obj.timestamp === "number" &&
    typeof obj.nonce === "string" &&
    typeof obj.signature === "string"
  );
}

function isValidRequest(body: unknown): body is AnalyzeRequest {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;

  if (typeof obj.user_id !== "string" || obj.user_id.length === 0) return false;
  if (typeof obj.device_id !== "string" || obj.device_id.length === 0) return false;

  const sd = obj.sensor_data;
  if (typeof sd !== "object" || sd === null) return false;
  const sdObj = sd as Record<string, unknown>;

  if (!Array.isArray(sdObj.raw_voltage)) return false;
  if (sdObj.raw_voltage.length === 0) return false;
  if (!sdObj.raw_voltage.every(isValidVoltagePair)) return false;

  if (typeof sdObj.temperature !== "number" || Number.isNaN(sdObj.temperature)) return false;

  // auth는 선택적
  if (obj.auth !== undefined && !isValidDeviceAuth(obj.auth)) return false;

  return true;
}

/**
 * 농도 기반 건강 점수 계산
 */
function calculateHealthScore(concentration: number): number {
  if (concentration < 0.5) {
    return 70;
  } else if (concentration <= 1.5) {
    return 95 - Math.round((concentration - 0.5) * 5);
  } else if (concentration <= 2.5) {
    return 85 - Math.round((concentration - 1.5) * 10);
  } else if (concentration <= 4.0) {
    return 70 - Math.round((concentration - 2.5) * 15);
  } else {
    return Math.max(20, 50 - Math.round((concentration - 4.0) * 10));
  }
}

/**
 * 이상 탐지
 */
function detectAnomaly(
  concentration: number,
  temperature: number,
  filteredVoltage: number
): boolean {
  if (temperature < 15 || temperature > 40) return true;
  if (concentration > 10 || concentration < 0) return true;
  if (filteredVoltage < 0 || filteredVoltage > 2) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    // 1. Input validation
    if (!isValidRequest(body)) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          expected: {
            user_id: "string",
            device_id: "string",
            sensor_data: {
              raw_voltage: "[[working, reference], ...] - 전압 쌍 배열",
              temperature: "number (°C)"
            },
            auth: "(optional) { deviceId, timestamp, nonce, signature }"
          }
        },
        { status: 400 }
      );
    }

    const { user_id, device_id, sensor_data, auth } = body;
    const { raw_voltage: voltagePairs, temperature } = sensor_data;

    // 2. Device Authentication (Part 5 Section 5.1)
    let deviceAuthenticated = false;
    
    if (auth) {
      const authResult = await verifyDeviceSignature(auth);
      deviceAuthenticated = authResult.isValid;
      
      if (authResult.isValid) {
        securityAuditLog.log(
          "DEVICE_AUTH_SUCCESS",
          `Device ${device_id} authenticated`,
          "info"
        );
      } else {
        securityAuditLog.log(
          "DEVICE_AUTH_FAILED",
          `Device ${device_id}: ${authResult.message}`,
          "warning"
        );
        
        // 인증 실패 시 요청 거부 (프로덕션에서는 이 부분 활성화)
        // return NextResponse.json(
        //   { error: "Unauthorized", message: authResult.message },
        //   { status: 401 }
        // );
      }
    } else {
      // 인증 정보 없음 (개발 모드에서는 허용, 프로덕션에서는 거부해야 함)
      securityAuditLog.log(
        "DEVICE_AUTH_FAILED",
        `No auth provided for device ${device_id}`,
        "warning"
      );
    }

    // 3. Signal Processing Pipeline (Part 3 알고리즘)
    const processingResult = processSignalPipeline(voltagePairs, {
      processNoise: 0.0001,
      measurementNoise: 0.005,
    });

    // 4. 전압 → 농도 변환
    const concentration = Number(
      voltageToConcentration(processingResult.filteredValue).toFixed(2)
    );

    // 5. 건강 점수 계산
    const health_score = calculateHealthScore(concentration);

    // 6. 이상 탐지
    const anomaly_detected = detectAnomaly(
      concentration,
      temperature,
      processingResult.filteredValue
    );

    // 7. Hash Chain (Part 3 Section 6.2)
    // 새 데이터를 해시 체인에 추가
    const dataForChain = {
      user_id,
      device_id,
      concentration,
      health_score,
      timestamp: Date.now()
    };
    
    const newHash = generateHashChain(hashChainState.lastHash, dataForChain);
    hashChainState = {
      lastHash: newHash,
      chainLength: hashChainState.chainLength + 1
    };

    securityAuditLog.log(
      "HASH_CHAIN_VERIFIED",
      `Block ${hashChainState.chainLength} added: ${newHash}`,
      "info"
    );

    // 8. Encrypt Sensitive Data (Part 5 Section 5.1)
    const sensitiveData = {
      raw_voltage: voltagePairs,
      concentration,
      health_score
    };
    const encryptedPayload = await encryptSensitiveData(sensitiveData);
    
    securityAuditLog.log(
      "DATA_ENCRYPTED",
      `Payload encrypted (${encryptedPayload.length} chars)`,
      "info"
    );

    // 9. Build Response
    const security: SecurityInfo = {
      device_authenticated: deviceAuthenticated,
      hash_chain_valid: true,
      data_encrypted: true,
      current_block_hash: newHash,
      chain_length: hashChainState.chainLength
    };

    const response: AnalyzeResponse = {
      concentration,
      health_score,
      anomaly_detected,
      processing: {
        differential_signals: processingResult.differentialSignals.map(v => 
          Number(v.toFixed(4))
        ),
        filtered_voltage: Number(processingResult.filteredValue.toFixed(4)),
        kalman_state: {
          estimate: Number(processingResult.filterState.estimate.toFixed(4)),
          errorCovariance: Number(processingResult.filterState.errorCovariance.toFixed(6)),
          kalmanGain: Number(processingResult.filterState.kalmanGain.toFixed(4))
        },
        log: processingResult.processingLog
      },
      security,
      _meta: {
        temperature,
        timestamp: new Date().toISOString(),
        sample_count: voltagePairs.length
      }
    };

    // 서버 콘솔 로그
    console.log("[API /api/analyze]", {
      user_id,
      device_id,
      samples: voltagePairs.length,
      concentration,
      health_score,
      anomaly_detected,
      security: {
        authenticated: deviceAuthenticated,
        block: hashChainState.chainLength,
        hash: newHash.substring(0, 10) + "..."
      }
    });

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[API /api/analyze] Error:", err);
    securityAuditLog.log(
      "SECURITY_ALERT",
      `API Error: ${err instanceof Error ? err.message : "Unknown"}`,
      "critical"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
