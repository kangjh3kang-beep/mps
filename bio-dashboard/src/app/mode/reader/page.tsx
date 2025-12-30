"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  RefreshCw,
  Wifi,
  WifiOff,
  Battery,
  Bluetooth,
  Settings,
  Wind,
  ShieldAlert,
  Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProvider, useUser } from "@/context/UserContext";
import { DeviceModeProvider, useDeviceMode } from "@/context/DeviceModeContext";
import { I18nProvider } from "@/lib/i18n";
import { getEHDDriver, useEHD, type EHDSuctionLevel } from "@/lib/ehd-driver";
import type { CalibrationParameters } from "@/lib/cartridge";
import { getRAFEController } from "@/lib/rafe-controller";
import { computeRemainingLife, getOxidationFactorPerHour, getWearFactor, getWearFactorAdvanced, hoursSince } from "@/lib/sensor-life";
import { ResultPage } from "@/components/dashboard/ResultPage";
import { deepAnalysisStore, type DeepAnalysisPacket } from "@/lib/deep-analysis";

/* ============================================
 * Reader Mode Page (480x320 Embedded Device)
 * 
 * Features:
 * - Big touch buttons
 * - High contrast
 * - Simplified UI
 * - Emergency button
 * ============================================ */

type ReaderView = "home" | "measuring" | "result" | "emergency";

function ReaderContent() {
  const user = useUser();
  const { config } = useDeviceMode();
  const ehd = useEHD();
  const [view, setView] = useState<ReaderView>("home");
  const [isConnected, setIsConnected] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [measureProgress, setMeasureProgress] = useState(0);
  
  // Simulate measurement
  const handleMeasure = useCallback(async () => {
    setView("measuring");
    setMeasureProgress(0);
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setMeasureProgress(i);
    }
    
    // Trigger actual measurement
    await user.handleMeasure();
    
    setView("result");
  }, [user]);
  
  // Get health status color
  const getStatusColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const getStatusText = (score: number) => {
    if (score >= 80) return "정상";
    if (score >= 60) return "주의";
    return "경고";
  };

  return (
    <div 
      className="w-[480px] h-[320px] bg-slate-900 text-white overflow-hidden flex flex-col"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      {/* Status Bar */}
      <header className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-400">MANPASIK</span>
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <Bluetooth className="w-3 h-3 text-blue-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <div className="flex items-center gap-1">
            <Battery className="w-4 h-4" />
            <span>{batteryLevel}%</span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col p-3">
        {view === "home" && (
          <HomeView 
            healthScore={user.healthScore}
            ehd={ehd}
            onMeasure={handleMeasure}
            onEmergency={() => setView("emergency")}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        )}
        
        {view === "measuring" && (
          <MeasuringView progress={measureProgress} />
        )}
        
        {view === "result" && (
          <ResultView 
            healthScore={user.healthScore}
            concentration={user.latestConcentration}
            calibration={user.activeCalibration}
            onBack={() => setView("home")}
            onMeasureAgain={handleMeasure}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        )}
        
        {view === "emergency" && (
          <EmergencyView onCancel={() => setView("home")} />
        )}
      </main>
      
      {/* Bottom Navigation */}
      {view === "home" && (
        <nav className="flex items-center justify-around px-3 py-2 bg-slate-800 border-t border-slate-700">
          <button className="flex flex-col items-center text-xs text-slate-400 hover:text-white">
            <Activity className="w-5 h-5 mb-0.5" />
            <span>기록</span>
          </button>
          <button className="flex flex-col items-center text-xs text-slate-400 hover:text-white">
            <Settings className="w-5 h-5 mb-0.5" />
            <span>설정</span>
          </button>
        </nav>
      )}
    </div>
  );
}

/* ============================================
 * Home View
 * ============================================ */

interface HomeViewProps {
  healthScore: number;
  ehd: ReturnType<typeof useEHD>;
  onMeasure: () => void;
  onEmergency: () => void;
  getStatusColor: (score: number) => string;
  getStatusText: (score: number) => string;
}

function HomeView({ healthScore, ehd, onMeasure, onEmergency, getStatusColor, getStatusText }: HomeViewProps) {
  const user = useUser();

  return (
    <div className="flex-1 flex flex-col gap-3">
      {/* Health Status */}
      <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
          getStatusColor(healthScore)
        )}>
          {healthScore}
        </div>
        <div>
          <div className="text-lg font-bold">{getStatusText(healthScore)}</div>
          <div className="text-sm text-slate-400">건강 점수</div>
        </div>
      </div>

      {/* Cartridge Health (Digital Twin) */}
      <ReaderCartridgeHealth
        cartridgeId={user.activeCartridge?.id ?? null}
        usageCount={user.activeCartridge?.usageCount ?? 0}
        openedAt={user.activeCartridge?.openedAt ?? user.activeCartridge?.registeredAt ?? null}
        calibration={user.activeCalibration}
      />
      
      {/* Main Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Measure Button */}
        <button
          onClick={onMeasure}
          className="flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-2xl transition-all touch-manipulation"
        >
          <Activity className="w-12 h-12 mb-2" />
          <span className="text-xl font-bold">측정</span>
          <span className="text-xs text-blue-200">MEASURE</span>
        </button>
        
        {/* Emergency Button */}
        <button
          onClick={onEmergency}
          className="flex flex-col items-center justify-center bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-2xl transition-all touch-manipulation"
        >
          <Phone className="w-12 h-12 mb-2" />
          <span className="text-xl font-bold">긴급</span>
          <span className="text-xs text-red-200">EMERGENCY</span>
        </button>
      </div>

      {/* Air Intake Control (EHD Active Air Suction) */}
      <AirIntakeControlPanel ehd={ehd} />
    </div>
  );
}

/* ============================================
 * Air Intake Control Panel (EHD)
 * ============================================ */

function AirIntakeControlPanel({ ehd }: { ehd: ReturnType<typeof useEHD> }) {
  const { state, setSuctionLevel, setHumidity, resetFault, voltageKV, ionicWindSpeed } = ehd;

  const setLevel = (lvl: EHDSuctionLevel) => setSuctionLevel(lvl);

  const speedPct = Math.round(ionicWindSpeed * 100);
  const windDuration = `${clamp(1200 - ionicWindSpeed * 900, 250, 1200)}ms`;

  const isFaulted = state.fault !== "NONE";
  const isShutdown = isFaulted || !state.enabled || state.humidityPct > 90;

  return (
    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-cyan-300" />
          <div>
            <div className="text-sm font-bold">Air Intake</div>
            <div className="text-[10px] text-slate-400">EHD Ionic Wind Control</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-bold text-cyan-200">{voltageKV.toFixed(2)} kV</div>
            <div className="text-[10px] text-slate-400">Flow {state.currentFlowRate.toFixed(1)}</div>
          </div>
          {isShutdown ? (
            <span className="text-[10px] px-2 py-1 rounded bg-rose-600/30 text-rose-200 border border-rose-500/40 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              SHUTDOWN
            </span>
          ) : (
            <span className="text-[10px] px-2 py-1 rounded bg-emerald-600/20 text-emerald-200 border border-emerald-500/30">
              ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Suction power selector (touch-friendly) */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <button
          className={cn(
            "py-2 rounded-lg font-bold text-sm border transition-all touch-manipulation",
            state.suctionLevel === "low" ? "bg-white text-slate-900 border-white" : "bg-slate-700 text-white border-slate-600",
            isShutdown && "opacity-60"
          )}
          onClick={() => setLevel("low")}
          disabled={isShutdown}
        >
          Low
        </button>
        <button
          className={cn(
            "py-2 rounded-lg font-bold text-sm border transition-all touch-manipulation",
            state.suctionLevel === "med" ? "bg-white text-slate-900 border-white" : "bg-slate-700 text-white border-slate-600",
            isShutdown && "opacity-60"
          )}
          onClick={() => setLevel("med")}
          disabled={isShutdown}
        >
          Med
        </button>
        <button
          className={cn(
            "py-2 rounded-lg font-bold text-sm border transition-all touch-manipulation",
            state.suctionLevel === "high" ? "bg-white text-slate-900 border-white" : "bg-slate-700 text-white border-slate-600",
            isShutdown && "opacity-60"
          )}
          onClick={() => setLevel("high")}
          disabled={isShutdown}
        >
          High
        </button>
      </div>

      {/* Ionic wind animation */}
      <div className="relative h-10 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500">
          Ionic Wind {speedPct}%
        </div>
        {!isShutdown && (
          <div
            className="absolute left-0 top-0 bottom-0 w-[200%] opacity-80"
            style={{
              background:
                "repeating-linear-gradient(90deg, rgba(34,211,238,0.0) 0px, rgba(34,211,238,0.0) 10px, rgba(34,211,238,0.5) 11px, rgba(34,211,238,0.0) 15px)",
              animation: `ehdWind ${windDuration} linear infinite`
            }}
          />
        )}
      </div>

      {/* Humidity + safety controls (demo) */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Droplets className="w-4 h-4 text-sky-300" />
          Humidity: <span className={cn("font-bold", state.humidityPct > 90 ? "text-rose-300" : "text-slate-100")}>{state.humidityPct.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded bg-slate-700 text-[10px] border border-slate-600 touch-manipulation"
            onClick={() => setHumidity(45)}
          >
            Dry
          </button>
          <button
            className="px-2 py-1 rounded bg-rose-700/60 text-[10px] border border-rose-500/40 touch-manipulation"
            onClick={() => setHumidity(95)}
          >
            95%
          </button>
          {isFaulted && (
            <button
              className="px-2 py-1 rounded bg-emerald-700/40 text-[10px] border border-emerald-500/30 touch-manipulation"
              onClick={resetFault}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Keyframes (scoped) */}
      <style>{`
        @keyframes ehdWind {
          0% { transform: translateX(-20%); }
          100% { transform: translateX(-70%); }
        }
      `}</style>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* ============================================
 * Reader Cartridge Health (Digital Twin)
 * ============================================ */

function ReaderCartridgeHealth({
  cartridgeId,
  usageCount,
  openedAt,
  calibration
}: {
  cartridgeId: string | null;
  usageCount: number;
  openedAt: number | null;
  calibration: CalibrationParameters | null;
}) {
  if (!cartridgeId || !openedAt) {
    return (
      <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-xs text-slate-400">
        🔋 카트리지 상태: 스캔 필요
      </div>
    );
  }

  const rafeCategory = getRAFEController().getState().category;
  const isGas = rafeCategory === "gas";

  const humidityPct = isGas ? getEHDDriver().getState().humidityPct : null;
  const env = isGas ? { humidityPct: humidityPct ?? 50, temperatureC: 25 } : undefined;

  const testType: "gas" | "blood" = isGas ? "gas" : "blood";
  const wearFactor = env ? getWearFactorAdvanced("gas", env) : getWearFactor(testType);
  const oxidationFactor = env ? getOxidationFactorPerHour("gas", env) : getOxidationFactorPerHour(testType);

  const timeHours = hoursSince(openedAt);
  const pred = computeRemainingLife({
    initialCapacity: 100,
    usageCount,
    wearFactor,
    timeSinceOpenHours: timeHours,
    oxidationFactor
  });

  const pct = Math.round(pred.remainingPct);
  const tests = pred.approxTestsRemaining;
  const isLow = pct < 10 && pct > 0;
  const isEmpty = pct <= 0;
  const lowPrecision = calibration?.precision === "low";

  return (
    <div className={cn(
      "rounded-xl p-3 border text-xs",
      isEmpty ? "bg-rose-900/30 border-rose-700 text-rose-200" :
      isLow ? "bg-amber-900/25 border-amber-700 text-amber-100" :
      "bg-slate-800 border-slate-700 text-slate-200"
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Battery className={cn("w-4 h-4", isEmpty ? "text-rose-400" : isLow ? "text-amber-300" : "text-emerald-300")} />
          <div className="font-bold">
            {pct}% Health
            <span className="ml-2 font-normal text-[10px] opacity-80">
              (~{tests} tests)
            </span>
          </div>
        </div>

        {lowPrecision && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-200">
            LOW PREC
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] opacity-80">
        <span>ID: {cartridgeId.replace("CTG-", "")}</span>
        <span>
          {isGas ? `GAS · RH ${humidityPct?.toFixed(0) ?? "?"}%` : "LIQUID"}
        </span>
      </div>

      <div className="mt-2 h-2 rounded bg-slate-900 border border-slate-700 overflow-hidden">
        <div
          className={cn(
            "h-full",
            isEmpty ? "bg-rose-500" : isLow ? "bg-amber-400" : "bg-emerald-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ============================================
 * Measuring View
 * ============================================ */

function MeasuringView({ progress }: { progress: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="relative w-32 h-32">
        {/* Progress Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className="text-blue-500"
            strokeDasharray={`${progress * 3.52} 352`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">{progress}%</span>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <div className="text-xl font-bold text-blue-400">측정 중...</div>
        <div className="text-sm text-slate-400 mt-1">카트리지를 분리하지 마세요</div>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
        <span className="text-sm text-slate-400">센서 데이터 분석</span>
      </div>
    </div>
  );
}

/* ============================================
 * Result View
 * ============================================ */

interface ResultViewProps {
  healthScore: number;
  concentration: number;
  calibration: CalibrationParameters | null;
  onBack: () => void;
  onMeasureAgain: () => void;
  getStatusColor: (score: number) => string;
  getStatusText: (score: number) => string;
}

function ResultView({ 
  healthScore, 
  concentration, 
  calibration,
  onBack, 
  onMeasureAgain,
  getStatusColor,
  getStatusText 
}: ResultViewProps) {
  const user = useUser();
  const isNormal = healthScore >= 80;
  const uncPct = calibration?.uncertaintyPct ?? (calibration?.precision === "low" ? 12 : 4);
  const unc = concentration * (uncPct / 100);
  const isLow = calibration?.precision === "low";

  const latestMeasurement = React.useMemo(() => {
    if (!user.measurements || user.measurements.length === 0) return null;
    return user.measurements.slice().sort((a, b) => b.ts - a.ts)[0] ?? null;
  }, [user.measurements]);

  const [deepPacket, setDeepPacket] = React.useState<DeepAnalysisPacket | null>(null);
  React.useEffect(() => {
    const id = latestMeasurement?.deepPacketId;
    if (!id) {
      setDeepPacket(null);
      return;
    }
    setDeepPacket(deepAnalysisStore.get(id));
  }, [latestMeasurement?.deepPacketId]);
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Dual View Result UI (Simple <-> Pro) */}
      <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
        <ResultPage
          healthScore={healthScore}
          concentrationMmolL={concentration}
          uncertaintyAbs={unc}
          deepPacket={deepPacket}
          userProfile={{ age: 45, gender: "other", conditions: [], goals: user.goals }}
        />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <button
          onClick={onBack}
          className="py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all touch-manipulation"
        >
          홈으로
        </button>
        <button
          onClick={onMeasureAgain}
          className="py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all touch-manipulation"
        >
          다시 측정
        </button>
      </div>
    </div>
  );
}

/* ============================================
 * Emergency View
 * ============================================ */

function EmergencyView({ onCancel }: { onCancel: () => void }) {
  const [countdown, setCountdown] = useState(10);
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Simulate emergency call
      alert("긴급 연락처로 연결됩니다.");
    }
  }, [countdown]);
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-red-900/30 rounded-xl">
      <AlertTriangle className="w-20 h-20 text-red-500 animate-pulse" />
      
      <div className="mt-4 text-center">
        <div className="text-2xl font-bold text-red-400">긴급 호출</div>
        <div className="text-sm text-slate-300 mt-1">
          {countdown}초 후 긴급 연락처로 연결됩니다
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-3 w-full max-w-xs">
        <button
          onClick={onCancel}
          className="py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-lg transition-all touch-manipulation"
        >
          취소
        </button>
        <button
          onClick={() => setCountdown(0)}
          className="py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-lg transition-all touch-manipulation"
        >
          즉시 호출
        </button>
      </div>
    </div>
  );
}

/* ============================================
 * Exported Page
 * ============================================ */

export default function ReaderModePage() {
  return (
    <I18nProvider>
      <UserProvider>
        <DeviceModeProvider forcedMode="reader">
          <div className="min-h-screen bg-black flex items-center justify-center">
            <ReaderContent />
          </div>
        </DeviceModeProvider>
      </UserProvider>
    </I18nProvider>
  );
}

