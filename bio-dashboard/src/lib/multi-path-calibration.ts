/**
 * Multi-Path Calibration System
 *
 * Goal: "Zero calibration failures" via fallback workflow:
 *  Step 1 (NFC): read mock NFC data -> if error, Step 2
 *  Step 2 (QR/Barcode): prompt scan -> if camera error, Step 3
 *  Step 3 (Cloud Lookup): fetch from server by serial -> if offline, Step 4
 *  Step 4 (Manual/Universal): apply universal coefficients, flag low precision mode
 *
 * This module provides:
 * - A workflow state machine for UI guidance (`CalibrationWorkflow`)
 * - A simple helper `calibrateSensor(cartridgeId)` that always returns a calibration (never throws)
 */

import type { CalibrationParameters } from "@/lib/cartridge";

export type CalibrationPath = "NFC" | "QR" | "CLOUD" | "UNIVERSAL";

export type CalibrationStep =
  | "idle"
  | "nfc"
  | "qr"
  | "cloud"
  | "universal"
  | "done";

export type CalibrationStatus = "idle" | "in_progress" | "needs_input" | "success";

export interface CalibrationResult {
  calibration: CalibrationParameters;
  path: CalibrationPath;
  lowPrecisionMode: boolean;
  offlineDetected: boolean;
  serialNumber: string;
  logs: string[];
}

export interface CalibrationWorkflowState {
  cartridgeId: string;
  step: CalibrationStep;
  status: CalibrationStatus;
  message: string;
  logs: string[];
  serialNumber: string | null;
  result: CalibrationResult | null;
  lowPrecisionMode: boolean;
  offlineDetected: boolean;
}

export const UNIVERSAL_STANDARD_COEFFICIENTS: CalibrationParameters = {
  sensitivityFactor: 1.0,
  offsetCorrection: 0,
  temperatureCoefficient: 0.01,
  batchCode: "UNIVERSAL-STD-LOW-PRECISION"
};

function nowStamp() {
  return new Date().toLocaleTimeString("ko-KR");
}

function pushLog(logs: string[], msg: string) {
  logs.push(`[${nowStamp()}] ${msg}`);
}

function safeTrim(v: string) {
  return (v ?? "").trim();
}

/**
 * Parse serial number from QR/Barcode string.
 * Accepts:
 * - "SN:XXXX"
 * - "SERIAL=XXXX"
 * - raw "CTG-2024-001-A001" style IDs
 */
export function parseSerialFromQr(qr: string): string | null {
  const raw = safeTrim(qr);
  if (!raw) return null;
  const m1 = raw.match(/(?:SN|SERIAL)\s*[:=]\s*([A-Za-z0-9-_]+)/i);
  if (m1?.[1]) return m1[1];
  return raw;
}

/**
 * Step 1: Mock NFC read.
 * Deterministic behavior: some cartridge IDs succeed, others fail.
 */
export async function readCalibrationFromNFC(cartridgeId: string): Promise<{ serialNumber: string; calibration: CalibrationParameters }> {
  await new Promise((r) => setTimeout(r, 350));
  const id = safeTrim(cartridgeId);
  if (!id) throw new Error("NFC_READ_ERROR:EMPTY_ID");

  // Demo heuristic: IDs containing these fragments succeed.
  const ok =
    /A001|A002|B001|DEMO/i.test(id) ||
    id.toLowerCase().includes("ctg-2024-001");

  if (!ok) {
    throw new Error("NFC_READ_ERROR:TAG_NOT_DETECTED");
  }

  // Mock coefficients derived from id
  const calibration: CalibrationParameters = {
    sensitivityFactor: 1.02,
    offsetCorrection: 12.3,
    temperatureCoefficient: 0.015,
    batchCode: `NFC-${id.slice(-6)}`
  };

  return { serialNumber: id, calibration };
}

/**
 * Step 3: Cloud lookup.
 */
export async function fetchCalibrationFromCloud(serialNumber: string): Promise<{ serialNumber: string; calibration: CalibrationParameters }> {
  const sn = safeTrim(serialNumber);
  if (!sn) throw new Error("CLOUD_LOOKUP_ERROR:EMPTY_SERIAL");

  // If offline, we treat as failure so workflow can fall back.
  if (typeof window !== "undefined" && "navigator" in window && navigator && navigator.onLine === false) {
    throw new Error("CLOUD_LOOKUP_ERROR:OFFLINE");
  }

  const res = await fetch(`/api/calibration?serial=${encodeURIComponent(sn)}`, { method: "GET" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `CLOUD_LOOKUP_ERROR:${res.status}`);
  }
  const data = (await res.json()) as { calibration: CalibrationParameters; serial: string };
  return { serialNumber: data.serial ?? sn, calibration: data.calibration };
}

/**
 * Workflow engine for UI guidance.
 */
export class CalibrationWorkflow {
  private state: CalibrationWorkflowState;

  constructor(cartridgeId: string) {
    this.state = {
      cartridgeId,
      step: "idle",
      status: "idle",
      message: "캘리브레이션 준비됨",
      logs: [],
      serialNumber: null,
      result: null,
      lowPrecisionMode: false
      ,
      offlineDetected: false
    };
  }

  getState(): CalibrationWorkflowState {
    return { ...this.state, logs: [...this.state.logs], result: this.state.result ? { ...this.state.result, logs: [...this.state.result.logs] } : null };
  }

  private setState(patch: Partial<CalibrationWorkflowState>) {
    this.state = { ...this.state, ...patch };
  }

  /**
   * Start the workflow: attempt NFC immediately.
   */
  async start(): Promise<CalibrationWorkflowState> {
    const logs = [...this.state.logs];
    this.setState({ step: "nfc", status: "in_progress", message: "NFC 캘리브레이션 읽는 중...", logs });
    pushLog(logs, "✅ Step 1 (NFC): 태그 읽기 시도");

    try {
      const { serialNumber, calibration } = await readCalibrationFromNFC(this.state.cartridgeId);
      pushLog(logs, `✅ NFC 성공: SN=${serialNumber}`);
      return this.finish("NFC", serialNumber, calibration, false, false, logs);
    } catch (e: any) {
      pushLog(logs, `❌ NFC 실패: ${e?.message || "Unknown error"}`);
      pushLog(logs, "➡️ NFC failed. Please scan the QR code on the back.");
      this.setState({
        step: "qr",
        status: "needs_input",
        message: "NFC 실패. 카트리지 뒷면 QR/바코드를 스캔해주세요.",
        logs
      });
      return this.getState();
    }
  }

  /**
   * Provide QR code content. This may still fail with a simulated camera error (optional).
   */
  async provideQRCode(qrContent: string, opts?: { simulateCameraError?: boolean }): Promise<CalibrationWorkflowState> {
    const logs = [...this.state.logs];
    const qr = safeTrim(qrContent);
    this.setState({ step: "qr", status: "in_progress", message: "QR/바코드 처리 중...", logs });
    pushLog(logs, "✅ Step 2 (QR/Barcode): 스캔 데이터 처리");

    try {
      if (opts?.simulateCameraError) {
        throw new Error("CAMERA_ERROR:PERMISSION_DENIED");
      }

      const serial = parseSerialFromQr(qr);
      if (!serial) throw new Error("QR_PARSE_ERROR:EMPTY");

      pushLog(logs, `✅ QR 성공: SN=${serial}`);
      // In this simulation, QR provides coefficients directly 50% of the time (e.g., encoded).
      const hasEmbeddedCoefficients = /CAL=/i.test(qr) || serial.toUpperCase().includes("DEMO");
      if (hasEmbeddedCoefficients) {
        const calibration: CalibrationParameters = {
          sensitivityFactor: 1.01,
          offsetCorrection: 11.5,
          temperatureCoefficient: 0.012,
          batchCode: `QR-${serial.slice(-6)}`
        };
        pushLog(logs, "✅ QR에 포함된 보정 계수 적용");
        return this.finish("QR", serial, calibration, false, false, logs);
      }

      // Otherwise proceed to cloud lookup with the serial.
      pushLog(logs, "ℹ️ QR에 보정 계수 미포함 → Cloud lookup으로 진행");
      this.setState({ serialNumber: serial, step: "cloud", status: "in_progress", message: "클라우드에서 보정 계수 조회 중...", logs });
      return await this.runCloudLookup(serial, logs);
    } catch (e: any) {
      pushLog(logs, `❌ QR/Camera 실패: ${e?.message || "Unknown error"}`);
      pushLog(logs, "➡️ Camera error. Proceeding to Cloud Lookup.");
      // We need a serial; fall back to cartridgeId as best-effort
      const fallbackSerial = this.state.serialNumber ?? this.state.cartridgeId;
      this.setState({ step: "cloud", status: "in_progress", message: "카메라 오류. 클라우드 조회로 전환...", logs, serialNumber: fallbackSerial });
      return await this.runCloudLookup(fallbackSerial, logs);
    }
  }

  private async runCloudLookup(serialNumber: string, logs: string[]): Promise<CalibrationWorkflowState> {
    pushLog(logs, "✅ Step 3 (Cloud): 서버에서 보정 계수 조회");
    try {
      const { serialNumber: sn, calibration } = await fetchCalibrationFromCloud(serialNumber);
      pushLog(logs, `✅ Cloud lookup 성공: SN=${sn}`);
      return this.finish("CLOUD", sn, calibration, false, false, logs);
    } catch (e: any) {
      const msg = String(e?.message || "Unknown error");
      pushLog(logs, `❌ Cloud lookup 실패: ${msg}`);
      const offlineDetected = msg.includes("OFFLINE") || (typeof navigator !== "undefined" && navigator.onLine === false);
      pushLog(
        logs,
        offlineDetected
          ? "➡️ Offline detected. Applying Universal Standard Coefficients (Low Precision Mode)."
          : "➡️ Server error. Applying Universal Standard Coefficients (Low Precision Mode)."
      );
      this.setState({ step: "universal", status: "in_progress", message: "오프라인/서버 오류. 범용 계수 적용(저정밀 모드)...", logs });
      await new Promise((r) => setTimeout(r, 250));
      const sn = safeTrim(serialNumber) || this.state.cartridgeId;
      return this.finish("UNIVERSAL", sn, UNIVERSAL_STANDARD_COEFFICIENTS, true, offlineDetected, logs);
    }
  }

  private finish(
    path: CalibrationPath,
    serialNumber: string,
    calibration: CalibrationParameters,
    lowPrecision: boolean,
    offlineDetected: boolean,
    logs: string[]
  ): CalibrationWorkflowState {
    const enhancedCalibration: CalibrationParameters = {
      ...calibration,
      source: path,
      precision: lowPrecision ? "low" : "high",
      // Suggested UI uncertainty: universal fallback is less precise
      uncertaintyPct: lowPrecision ? 12 : 4,
      offlineFallback: lowPrecision ? offlineDetected : false
    };

    const result: CalibrationResult = {
      calibration: enhancedCalibration,
      path,
      lowPrecisionMode: lowPrecision,
      offlineDetected,
      serialNumber,
      logs
    };
    this.setState({
      step: "done",
      status: "success",
      message: lowPrecision ? "캘리브레이션 완료 (저정밀 모드)" : "캘리브레이션 완료",
      logs,
      serialNumber,
      result,
      lowPrecisionMode: lowPrecision,
      offlineDetected
    });
    pushLog(logs, lowPrecision ? "✅ Step 4 (Universal): 범용 계수 적용 완료 (Low Precision)" : "✅ Calibration 완료");
    return this.getState();
  }
}

/**
 * Convenience helper: always returns a CalibrationResult and never throws.
 * UI-less environments can call this and rely on guaranteed fallback to UNIVERSAL.
 */
export async function calibrateSensor(cartridgeId: string): Promise<CalibrationResult> {
  const wf = new CalibrationWorkflow(cartridgeId);
  let st = await wf.start();
  // if QR is needed, we cannot truly prompt in a headless call, so we use cartridgeId as a QR payload.
  if (st.step === "qr") {
    st = await wf.provideQRCode(cartridgeId);
  }
  // if still not done (should not happen), force universal
  const final = st.result;
  if (final) return final;
  return {
    calibration: {
      ...UNIVERSAL_STANDARD_COEFFICIENTS,
      source: "UNIVERSAL",
      precision: "low",
      uncertaintyPct: 12,
      offlineFallback: typeof navigator !== "undefined" ? navigator.onLine === false : false
    },
    path: "UNIVERSAL",
    lowPrecisionMode: true,
    offlineDetected: typeof navigator !== "undefined" ? navigator.onLine === false : false,
    serialNumber: cartridgeId,
    logs: [...st.logs, `[${nowStamp()}] ✅ Forced universal fallback`]
  };
}


