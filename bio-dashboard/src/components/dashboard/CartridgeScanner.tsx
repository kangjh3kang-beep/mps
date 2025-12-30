"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { 
  ScanLine, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Package,
  Calendar,
  Activity,
  Lock,
  Unlock,
  RefreshCw,
  Nfc,
  Cloud,
  Barcode,
  ShieldAlert,
  SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  cartridgeRegistry, 
  DEMO_CARTRIDGE_IDS,
  type CartridgeInfo,
  type CalibrationParameters,
  type CartridgeScanResult
} from "@/lib/cartridge";
import { CalibrationWorkflow } from "@/lib/multi-path-calibration";
import { cartridgeEcosystem } from "@/lib/cartridge-ecosystem";
import { getRAFEController } from "@/lib/rafe-controller";
import { useAppToast } from "@/components/system/AppToast";

interface CartridgeScannerProps {
  onCartridgeAuthenticated?: (
    cartridge: CartridgeInfo, 
    calibration: CalibrationParameters
  ) => void;
  onCartridgeRejected?: (reason: string) => void;
  onTargetAnalyteDetected?: (analyte: string) => void;
}

export default function CartridgeScanner({
  onCartridgeAuthenticated,
  onCartridgeRejected,
  onTargetAnalyteDetected
}: CartridgeScannerProps) {
  const { toast } = useAppToast();
  const rafeController = useMemo(() => getRAFEController(), []);
  const [rafeLock, setRafeLock] = useState(() => rafeController.getLockState());
  const [scannedId, setScannedId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<CartridgeScanResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Multi-path calibration workflow UI state
  const [calibrationWorkflow, setCalibrationWorkflow] = useState<CalibrationWorkflow | null>(null);
  const [calState, setCalState] = useState(() => ({
    step: "idle" as string,
    status: "idle" as string,
    message: "",
    lowPrecisionMode: false,
    offlineDetected: false
  }));
  const [qrInput, setQrInput] = useState("");
  const [simulateCameraError, setSimulateCameraError] = useState(false);
  const [detectedProfileName, setDetectedProfileName] = useState<string | null>(null);
  const [detectedAnalyte, setDetectedAnalyte] = useState<string | null>(null);

  // Profile + analyte override preferences (persisted)
  const USER_ID = "demo-user";
  const LS_PROFILE_KEY = "manpasik:sdms:selectedProfileId";
  const LS_GAS_PREF_KEY = "manpasik:sdms:gasPreference"; // auto | radon | vocs

  type GasPreference = "auto" | "radon" | "vocs";
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [gasPreference, setGasPreference] = useState<GasPreference>("auto");

  useEffect(() => {
    // lock/unlock triggers controller.notifyListeners() so this updates reliably
    const unsubscribe = rafeController.subscribe(() => setRafeLock(rafeController.getLockState()));
    return unsubscribe;
  }, [rafeController]);

  const notifyLocked = useCallback(() => {
    toast({
      title: "Stabilizing… 변경 불가",
      description: "접촉 안정화(홀드 3초) 중에는 SDMS/RAFE 설정 변경이 잠깐 잠깁니다.",
      variant: "warning"
    });
  }, [toast]);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(LS_PROFILE_KEY);
      if (savedProfile) setSelectedProfileId(savedProfile);
      const savedGasPref = localStorage.getItem(LS_GAS_PREF_KEY) as GasPreference | null;
      if (savedGasPref === "auto" || savedGasPref === "radon" || savedGasPref === "vocs") {
        setGasPreference(savedGasPref);
      }
    } catch {
      // ignore
    }
  }, []);

  const syncedProfiles = useMemo(() => {
    const lib = cartridgeEcosystem.getUserLibrary(USER_ID);
    const items = lib.cartridges
      .slice()
      .sort((a, b) => (b.lastSyncAt ?? b.purchasedAt) - (a.lastSyncAt ?? a.purchasedAt));
    const synced = items.filter((x) => x.syncedToDevice);
    // fall back to any library items if none are synced
    return (synced.length > 0 ? synced : items)
      .map((item) => {
        const profile = cartridgeEcosystem.getCartridgeById(item.cartridgeId);
        return profile
          ? { item, profile }
          : null;
      })
      .filter(Boolean) as { item: typeof items[number]; profile: any }[];
  }, [logs.length]); // cheap re-run when logs change (scan flow)

  const effectiveProfile = useMemo(() => {
    if (syncedProfiles.length === 0) return null;
    const selected = selectedProfileId
      ? syncedProfiles.find((x) => x.profile.id === selectedProfileId)
      : null;
    return selected ?? syncedProfiles[0];
  }, [syncedProfiles, selectedProfileId]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString("ko-KR");
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const addWorkflowLines = useCallback((lines: string[]) => {
    // Workflow logs already contain timestamps; strip them to avoid double timestamps.
    lines.forEach((l) => {
      const stripped = l.replace(/^\[[^\]]+\]\s*/, "");
      addLog(stripped);
    });
  }, [addLog]);

  const handleScan = async () => {
    if (!scannedId.trim()) {
      addLog("⚠️ 카트리지 ID를 입력해주세요.");
      return;
    }

    setIsScanning(true);
    addLog(`🔍 스캔 중: ${scannedId}`);

    // 스캔 시뮬레이션 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));

    addLog("📡 QC 데이터베이스 조회 중...");
    await new Promise(resolve => setTimeout(resolve, 500));

    // 1) Cartridge authenticity / QC validation
    const result = cartridgeRegistry.scanAndAuthenticate(scannedId.trim());
    // We will apply calibration via multi-path workflow; avoid showing QC-derived calibration block.
    setScanResult({ ...result, calibration: null });

    if (result.success && result.cartridge) {
      addLog(`✅ 인증 성공: Lot ${result.cartridge.qcData.lotNumber}`);
      addLog("🧭 Multi-Path Calibration 시작 (NFC → QR → Cloud → Universal)");

      // 2) Multi-path calibration workflow (never fails)
      const wf = new CalibrationWorkflow(result.cartridge.id);
      setCalibrationWorkflow(wf);
      const st1 = await wf.start();
      setCalState({
        step: st1.step,
        status: st1.status,
        message: st1.message,
        lowPrecisionMode: st1.lowPrecisionMode,
        offlineDetected: st1.offlineDetected
      });
      addWorkflowLines(st1.logs.slice(-6));

      // If already calibrated via NFC, finalize immediately
      if (st1.result && st1.result.calibration) {
        const cal = {
          ...st1.result.calibration,
          gelIntrinsicImpedanceOhm: result.cartridge.qcData.gelIntrinsicImpedanceOhm
        };
        addLog(`🔧 보정경로: ${st1.result.path}${st1.result.lowPrecisionMode ? " (LOW PRECISION)" : ""}`);
        if (st1.result.lowPrecisionMode && st1.result.offlineDetected) {
          addLog("📴 오프라인 감지됨 → Universal 계수 적용 (저정밀 모드)");
        }
        addLog(`🔧 보정코드: ${cal.batchCode}`);
        addLog(`📊 감도계수: ${cal.sensitivityFactor.toFixed(3)}`);
        addLog(`📐 오프셋: ${cal.offsetCorrection.toFixed(2)} mV`);
        onCartridgeAuthenticated?.(result.cartridge, cal);
        autoSelectAnalyteFromDigitalProfile(result.cartridge.id, cal);
      }
    } else {
      addLog(`❌ 인증 실패: ${result.message}`);
      result.errors.forEach(err => addLog(`   - ${err}`));
      
      onCartridgeRejected?.(result.message);
    }

    setIsScanning(false);
  };

  const pickAnalyteFromProfile = useCallback((profile: any) => {
    const analytes = (profile?.spec?.targetAnalytes ?? []) as { id: string; name: string; nameKo: string }[];
    if (analytes.length === 0) return null;

    const hasRadon = analytes.some((a) => a.id === "radon");
    const hasVocs = analytes.some((a) => a.id === "vocs");

    const base = ["ammonia", "h2s", "co2", "glucose", "lactate"];
    const preferredOrder =
      gasPreference === "radon"
        ? ["radon", "vocs", ...base]
        : gasPreference === "vocs"
          ? ["vocs", "radon", ...base]
          : ["radon", "vocs", ...base];

    const chosen =
      analytes
        .slice()
        .sort((a, b) => preferredOrder.indexOf(a.id) - preferredOrder.indexOf(b.id))
        .find((a) => preferredOrder.includes(a.id)) ??
      analytes[0];

    return { chosen, hasRadon, hasVocs };
  }, [gasPreference]);

  const applyProfileSelection = useCallback((profile: any, source: "auto" | "manual") => {
    if (rafeLock.locked && source === "manual") {
      notifyLocked();
      return;
    }
    const picked = pickAnalyteFromProfile(profile);
    if (!picked) return;
    const { chosen } = picked;
    setDetectedProfileName(profile.marketing.titleKo || profile.marketing.title);
    setDetectedAnalyte(chosen.name);
    addLog(`🧩 디지털 프로필 ${source === "auto" ? "자동" : "수동"} 선택: ${profile.marketing.titleKo || profile.marketing.title}`);
    addLog(`🎯 타겟 ${source === "auto" ? "자동" : "수동"} 설정: ${chosen.name} (${chosen.nameKo})`);
    onTargetAnalyteDetected?.(chosen.name);
  }, [addLog, notifyLocked, onTargetAnalyteDetected, pickAnalyteFromProfile, rafeLock.locked]);

  const autoSelectAnalyteFromDigitalProfile = (cartridgeId: string, calibration: CalibrationParameters) => {
    // Fully automatic: use last synced digital cartridge profile (if present) to infer target analyte(s).
    // This simulates a Reader having its firmware lookup table updated via BLE sync.
    const profile = effectiveProfile?.profile;
    if (!profile) return;
    applyProfileSelection(profile, "auto");
  };

  const handleProvideQr = async () => {
    if (!calibrationWorkflow || !scanResult?.cartridge) return;
    setIsScanning(true);
    addLog("📷 QR/바코드 스캔 단계 실행...");
    const st = await calibrationWorkflow.provideQRCode(qrInput || scanResult.cartridge.id, {
      simulateCameraError
    });
    setCalState({
      step: st.step,
      status: st.status,
      message: st.message,
      lowPrecisionMode: st.lowPrecisionMode,
      offlineDetected: st.offlineDetected
    });
    addWorkflowLines(st.logs.slice(-8));

    if (st.result?.calibration) {
      const cal = {
        ...st.result.calibration,
        gelIntrinsicImpedanceOhm: scanResult.cartridge.qcData.gelIntrinsicImpedanceOhm
      };
      addLog(`🔧 보정경로: ${st.result.path}${st.result.lowPrecisionMode ? " (LOW PRECISION)" : ""}`);
      if (st.result.lowPrecisionMode && st.result.offlineDetected) {
        addLog("📴 오프라인 감지됨 → Universal 계수 적용 (저정밀 모드)");
      }
      addLog(`🔧 보정코드: ${cal.batchCode}`);
      addLog(`📊 감도계수: ${cal.sensitivityFactor.toFixed(3)}`);
      addLog(`📐 오프셋: ${cal.offsetCorrection.toFixed(2)} mV`);
      onCartridgeAuthenticated?.(scanResult.cartridge, cal);
      autoSelectAnalyteFromDigitalProfile(scanResult.cartridge.id, cal);
    }
    setIsScanning(false);
  };

  const handleQuickSelect = (id: string) => {
    setScannedId(id);
  };

  const handleReset = () => {
    cartridgeRegistry.reset();
    setScanResult(null);
    setLogs([]);
    setScannedId("");
    setCalibrationWorkflow(null);
    setCalState({ step: "idle", status: "idle", message: "", lowPrecisionMode: false, offlineDetected: false });
    setQrInput("");
    setDetectedProfileName(null);
    setDetectedAnalyte(null);
    setSelectedProfileId(null);
    setGasPreference("auto");
    try {
      localStorage.removeItem(LS_PROFILE_KEY);
      localStorage.removeItem(LS_GAS_PREF_KEY);
    } catch {
      // ignore
    }
    addLog("🔄 카트리지 레지스트리 초기화됨");
  };

  const inventory = cartridgeRegistry.getInventoryStatus();

  const getStatusBadge = (status: CartridgeInfo["status"]) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-500"><Unlock className="w-3 h-3 mr-1" />사용가능</Badge>;
      case "used":
        return <Badge className="bg-gray-500"><Lock className="w-3 h-3 mr-1" />사용됨</Badge>;
      case "expired":
        return <Badge className="bg-orange-500"><Calendar className="w-3 h-3 mr-1" />만료</Badge>;
      case "qc_failed":
        return <Badge className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" />QC실패</Badge>;
      default:
        return <Badge variant="outline">미확인</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="w-5 h-5 text-primary" />
          카트리지 스캐너
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* 스캔 입력 영역 */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="카트리지 ID 입력 또는 QR/NFC 스캔"
              value={scannedId}
              onChange={(e) => setScannedId(e.target.value)}
              disabled={isScanning}
              className="flex-1"
            />
            <Button 
              onClick={handleScan} 
              disabled={isScanning}
              className="shrink-0"
            >
              {isScanning ? (
                <ScanLine className="w-4 h-4 animate-pulse" />
              ) : (
                <ScanLine className="w-4 h-4" />
              )}
              <span className="ml-2">스캔</span>
            </Button>
          </div>

          {/* 데모 카트리지 빠른 선택 */}
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground mr-1">데모:</span>
            {DEMO_CARTRIDGE_IDS.slice(0, 4).map((id) => (
              <button
                key={id}
                onClick={() => handleQuickSelect(id)}
                className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
              >
                {id.replace("CTG-", "").slice(0, 8)}...
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Multi-Path Calibration Guidance */}
        {scanResult?.success && scanResult.cartridge && (
          <div className={cn(
            "p-3 rounded-lg border",
            calState.lowPrecisionMode ? "bg-amber-50 border-amber-200" : "bg-sky-50 border-sky-200"
          )}>
            <div className="flex items-start gap-2">
              {calState.lowPrecisionMode ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Nfc className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    🧪 Multi-Path Calibration
                  </p>
                  {calState.lowPrecisionMode ? (
                    <Badge className="bg-amber-500">LOW PRECISION</Badge>
                  ) : (
                    <Badge variant="secondary">HIGH PRECISION</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {calState.message || "NFC를 먼저 시도합니다. 실패 시 QR → Cloud → Universal로 자동 진행합니다."}
                </p>
                {calState.lowPrecisionMode && (
                  <div className="mt-1 text-xs text-amber-700">
                    {calState.offlineDetected
                      ? "📴 오프라인 감지됨 → Universal 계수 적용됨 (저정밀)"
                      : "⚠️ Universal 계수 적용됨 (저정밀)"}
                  </div>
                )}

                {/* Step badges */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className={cn(calState.step === "nfc" && "border-sky-500 text-sky-700")}>
                    <Nfc className="w-3 h-3 mr-1" /> NFC
                  </Badge>
                  <Badge variant="outline" className={cn(calState.step === "qr" && "border-sky-500 text-sky-700")}>
                    <Barcode className="w-3 h-3 mr-1" /> QR/Barcode
                  </Badge>
                  <Badge variant="outline" className={cn(calState.step === "cloud" && "border-sky-500 text-sky-700")}>
                    <Cloud className="w-3 h-3 mr-1" /> Cloud
                  </Badge>
                  <Badge variant="outline" className={cn(calState.step === "universal" && "border-amber-500 text-amber-700")}>
                    Universal
                  </Badge>
                </div>

                {/* QR input step */}
                {calState.step === "qr" && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        placeholder="QR/바코드 내용 입력 (예: SN:CTG-2024-001-A001)"
                        disabled={isScanning}
                      />
                      <Button onClick={handleProvideQr} disabled={isScanning}>
                        스캔
                      </Button>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={simulateCameraError}
                        onChange={(e) => setSimulateCameraError(e.target.checked)}
                      />
                      카메라 오류 시뮬레이션 (QR 실패 → Cloud로 폴백)
                    </label>
                  </div>
                )}

                {/* Digital profile → auto analyte link status */}
                {(detectedProfileName || detectedAnalyte) && (
                  <div className="mt-2 p-2 rounded bg-white/60 text-xs">
                    <div className="font-medium">🔗 SDMS 자동 연동</div>
                    {detectedProfileName && <div>Profile: {detectedProfileName}</div>}
                    {detectedAnalyte && <div>Target: {detectedAnalyte}</div>}
                    <div className="text-muted-foreground mt-1">
                      가스 카트리지(환경/공기) 프로필이 sync된 경우 Radon/VOCs로 자동 설정됩니다.
                    </div>
                  </div>
                )}

                {/* Profile selection UI (when multiple profiles exist) */}
                {syncedProfiles.length > 1 && effectiveProfile?.profile && (
                  <div className="mt-2 p-2 rounded bg-white/70 text-xs border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3" />
                        프로필 선택
                        {rafeLock.locked && (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">
                            Stabilizing… 변경 불가
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {syncedProfiles.filter(x => x.item.syncedToDevice).length > 0 ? "Synced" : "Library"} · {syncedProfiles.length}
                      </span>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <select
                        className="flex-1 rounded border px-2 py-1 bg-white"
                        value={effectiveProfile.profile.id}
                        onChange={(e) => {
                          if (rafeLock.locked) {
                            notifyLocked();
                            return;
                          }
                          const id = e.target.value;
                          setSelectedProfileId(id);
                          try { localStorage.setItem(LS_PROFILE_KEY, id); } catch {}
                          const picked = syncedProfiles.find((x) => x.profile.id === id);
                          if (picked?.profile) {
                            applyProfileSelection(picked.profile, "manual");
                          }
                        }}
                      >
                        {syncedProfiles.map(({ profile, item }) => (
                          <option key={profile.id} value={profile.id}>
                            {(profile.marketing.titleKo || profile.marketing.title) + (item.syncedToDevice ? " (Synced)" : "")}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (rafeLock.locked) return notifyLocked();
                          applyProfileSelection(effectiveProfile.profile, "manual");
                        }}
                      >
                        적용
                      </Button>
                    </div>

                    {/* Gas preference override when both Radon/VOCs exist */}
                    {(() => {
                      const picked = pickAnalyteFromProfile(effectiveProfile.profile);
                      const hasRadon = picked?.hasRadon;
                      const hasVocs = picked?.hasVocs;
                      if (!hasRadon || !hasVocs) return null;
                      return (
                        <div className="mt-2">
                          <div className="text-[11px] font-medium mb-1">가스 타겟 우선순위</div>
                          <div className="grid grid-cols-3 gap-1">
                            {(["auto", "radon", "vocs"] as const).map((pref) => (
                              <button
                                key={pref}
                                className={cn(
                                  "py-1 rounded border text-[11px] transition-colors",
                                  gasPreference === pref ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
                                )}
                                onClick={() => {
                                  if (rafeLock.locked) return notifyLocked();
                                  setGasPreference(pref);
                                  try { localStorage.setItem(LS_GAS_PREF_KEY, pref); } catch {}
                                  // re-apply with new preference
                                  applyProfileSelection(effectiveProfile.profile, "manual");
                                }}
                              >
                                {pref === "auto" ? "Auto" : pref === "radon" ? "Prefer Radon" : "Prefer VOCs"}
                              </button>
                            ))}
                          </div>
                          <div className="text-muted-foreground mt-1">
                            Auto는 프로필의 추천 순서로 선택합니다. Prefer는 Radon/VOCs 중 우선 선택을 강제합니다.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 인증 결과 */}
        {scanResult && (
          <div className={`p-3 rounded-lg border ${
            scanResult.success 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-start gap-2">
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  scanResult.success ? "text-green-800" : "text-red-800"
                }`}>
                  {scanResult.message}
                </p>
                
                {scanResult.cartridge && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(scanResult.cartridge.status)}
                      <span className="text-xs text-muted-foreground">
                        {scanResult.cartridge.usageCount}/{scanResult.cartridge.maxUsageCount} 사용
                      </span>
                    </div>
                    
                    {scanResult.cartridge.qcData && (
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          Lot: {scanResult.cartridge.qcData.lotNumber}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          만료: {scanResult.cartridge.qcData.expirationDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          감도: {scanResult.cartridge.qcData.sensitivity} mV/mmol·L⁻¹
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {scanResult.calibration && (
                  <div className="mt-2 p-2 bg-white/60 rounded text-xs">
                    <div className="font-medium text-primary">📐 적용된 보정값</div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <span>감도계수:</span>
                      <span className="font-mono">{scanResult.calibration.sensitivityFactor.toFixed(3)}</span>
                      <span>오프셋:</span>
                      <span className="font-mono">{scanResult.calibration.offsetCorrection.toFixed(1)} mV</span>
                      <span>보정코드:</span>
                      <span className="font-mono">{scanResult.calibration.batchCode}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 인벤토리 현황 */}
        <div className="bg-muted/50 p-2 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">📦 인벤토리 현황</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              초기화
            </Button>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-green-600">✓ {inventory.available}</span>
            <span className="text-gray-500">● {inventory.used}</span>
            <span className="text-orange-500">⌛ {inventory.expired}</span>
            <span className="text-red-500">✗ {inventory.qcFailed}</span>
          </div>
        </div>

        {/* 로그 영역 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full bg-slate-900 rounded-lg p-2 overflow-y-auto">
            <div className="font-mono text-xs text-green-400 space-y-0.5">
              {logs.length === 0 ? (
                <div className="text-slate-500">카트리지를 스캔해주세요...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
