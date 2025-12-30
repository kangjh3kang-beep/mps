"use client";

/**
 * 칼만 필터를 더 정교한 수학적 함수로 구현합니다.
 * 
 * Part 3, 2.2 기준:
 * - x̂_k = x̂_{k-1} + K_k (z_k - x̂_{k-1})
 * - P_k = (1 - K_k) P_{k-1}
 * - K_k = P_{k-1} / (P_{k-1} + R)
 *
 * @param {number} prevEstimate 이전 상태 추정 (x̂_{k-1})
 * @param {number} prevErrorCov 이전 오차 공분산 (P_{k-1})
 * @param {number} measurement 현재 측정값 (z_k)
 * @param {number} measurementNoise 측정 잡음 분산 (R)
 * @returns {{ estimate: number; errorCov: number }} 업데이트된 추정 및 오차 공분산
 */
export function kalmanFilter(
  prevEstimate: number,
  prevErrorCov: number,
  measurement: number,
  measurementNoise: number
): { estimate: number; errorCov: number } {
  // 칼만 이득 계산
  const K = prevErrorCov / (prevErrorCov + measurementNoise);

  // 새 추정값 계산
  const estimate = prevEstimate + K * (measurement - prevEstimate);

  // 오차 공분산 업데이트
  const errorCov = (1 - K) * prevErrorCov;

  return { estimate, errorCov };
}

import * as React from "react";
import Link from "next/link";
import { Activity, Eraser, Loader2, PlayCircle, ShieldAlert, FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SensorLog = { ts: number; lines: string[] };

export function SensorSimulator({
  onMeasure,
  logs,
  onClear,
  latestScore,
  isLoading = false,
  disabled = false,
  safetySignal
  ,
  failSafeLock
  ,
  onSupportUnlock
}: {
  onMeasure: () => void;
  logs: SensorLog[];
  onClear: () => void;
  latestScore: number;
  isLoading?: boolean;
  disabled?: boolean;
  safetySignal?: { ts: number; maxTempC: number; maxVoltageV: number };
  failSafeLock?: { locked: boolean; reason: string; ts: number };
  onSupportUnlock?: () => void;
}) {
  const [criticalError, setCriticalError] = React.useState<{
    active: boolean;
    reason: string;
    ts: number;
  }>({ active: false, reason: "", ts: 0 });

  // Hard-coupled fail-safe detection (preferred): from UserContext telemetry
  React.useEffect(() => {
    if (!safetySignal) return;
    if (criticalError.active) return;
    if (Number.isFinite(safetySignal.maxTempC) && safetySignal.maxTempC > 60) {
      setCriticalError({
        active: true,
        reason: `SensorTemp ${safetySignal.maxTempC.toFixed(1)}°C > 60°C (telemetry)`,
        ts: Date.now()
      });
      return;
    }
    if (Number.isFinite(safetySignal.maxVoltageV) && safetySignal.maxVoltageV > 5) {
      setCriticalError({
        active: true,
        reason: `Voltage ${safetySignal.maxVoltageV.toFixed(2)}V > 5V (telemetry)`,
        ts: Date.now()
      });
    }
  }, [safetySignal, criticalError.active]);

  // Global lock display (if persisted / triggered elsewhere)
  React.useEffect(() => {
    if (!failSafeLock?.locked) return;
    if (criticalError.active) return;
    setCriticalError({
      active: true,
      reason: `FAIL-SAFE LOCK: ${failSafeLock.reason}`,
      ts: failSafeLock.ts
    });
  }, [failSafeLock, criticalError.active]);

  // Fail-safe detection (based on the latest log lines)
  React.useEffect(() => {
    if (logs.length === 0) return;
    const latest = logs[logs.length - 1]!;
    const text = latest.lines.join("\n");

    // Parse patterns like "Temperature: 65C" or "Temp: 65" etc.
    const tempMatch =
      text.match(/SensorTemp\s*>\s*([0-9]+(?:\.[0-9]+)?)\s*°?C/i) ??
      text.match(/SensorTemp\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*°?C/i) ??
      text.match(/Temp(?:erature)?\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*°?C/i);

    const voltMatch =
      text.match(/Voltage\s*>\s*([0-9]+(?:\.[0-9]+)?)\s*V/i) ??
      text.match(/Voltage\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*V/i);

    const tempC = tempMatch ? Number(tempMatch[1]) : null;
    const voltV = voltMatch ? Number(voltMatch[1]) : null;

    if (!criticalError.active) {
      if (tempC !== null && Number.isFinite(tempC) && tempC > 60) {
        setCriticalError({ active: true, reason: `SensorTemp ${tempC.toFixed(1)}°C > 60°C`, ts: Date.now() });
      } else if (voltV !== null && Number.isFinite(voltV) && voltV > 5) {
        setCriticalError({ active: true, reason: `Voltage ${voltV.toFixed(2)}V > 5V`, ts: Date.now() });
      }
    }
  }, [logs, criticalError.active]);

  const exportLogs = React.useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      criticalError: criticalError.active ? criticalError : null,
      safetySignal: safetySignal ?? null,
      failSafeLock: failSafeLock ?? null,
      logs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manpasik-sensor-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, criticalError, safetySignal, failSafeLock]);

  const isDisabled = disabled || isLoading;
  const safeMode = criticalError.active;

  // Support PIN unlock flow
  const SUPPORT_PIN = "11111"; // demo fixed PIN
  const COOLDOWN_KEY = "manpasik:supportUnlock:cooldownUntil";
  const [unlockOpen, setUnlockOpen] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [attempts, setAttempts] = React.useState(0);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = React.useState<number>(0);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(COOLDOWN_KEY);
      const v = raw ? Number(raw) : 0;
      setCooldownUntil(Number.isFinite(v) ? v : 0);
    } catch {
      setCooldownUntil(0);
    }
  }, []);

  const inCooldown = cooldownUntil > Date.now();

  const startCooldown = (ms: number) => {
    const until = Date.now() + ms;
    setCooldownUntil(until);
    try {
      localStorage.setItem(COOLDOWN_KEY, String(until));
    } catch {
      // ignore
    }
  };

  const resetUnlockState = () => {
    setPin("");
    setAttempts(0);
    setUnlockError(null);
  };

  const handleUnlock = () => {
    if (!onSupportUnlock) {
      setUnlockError("지원자 해제 기능이 연결되어 있지 않습니다.");
      return;
    }
    if (inCooldown) {
      setUnlockError("잠금 해제 시도가 너무 많습니다. 잠시 후 다시 시도하세요.");
      return;
    }
    if (pin.trim() !== SUPPORT_PIN) {
      const next = attempts + 1;
      setAttempts(next);
      setUnlockError(`PIN이 올바르지 않습니다. (${next}/5)`);
      if (next >= 5) {
        startCooldown(5 * 60_000); // 5 minutes
        setUnlockError("PIN 시도 횟수 초과. 5분 후 다시 시도하세요.");
      }
      return;
    }

    // Success
    onSupportUnlock();
    setUnlockOpen(false);
    resetUnlockState();
  };
  
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Sensor Simulator
          </CardTitle>
          <CardDescription>
            Measure 클릭 → Raw Voltage → Mock Kalman Filter → Calibrated 농도값으로 업데이트
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {safeMode && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4" />
                Safe Mode Active - Contact Support
              </div>
              <div className="text-xs mt-1">
                Critical hardware fault detected: <span className="font-mono">{criticalError.reason}</span>
              </div>
              <div className="text-[11px] text-rose-800 mt-1">
                측정은 즉시 중지되며, 로그 내보내기만 가능합니다.
              </div>
              {failSafeLock?.locked && (
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" className="h-7 text-xs" onClick={() => setUnlockOpen(true)}>
                    Support PIN 해제
                  </Button>
                  {inCooldown && (
                    <div className="text-[11px] text-rose-700 self-center">
                      해제 쿨다운 중: {Math.ceil((cooldownUntil - Date.now()) / 1000)}s
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {disabled && (
            <div className="p-2 mb-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-center">
              ⚠️ 측정하려면 유효한 카트리지를 먼저 스캔해주세요
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button onClick={onMeasure} className="flex-1" disabled={isDisabled || safeMode}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Measuring..." : "Measure"}
            </Button>
            <Button
              variant="outline"
              onClick={onClear}
              aria-label="로그 비우기"
              disabled={isLoading || safeMode}
            >
              <Eraser className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button variant="outline" onClick={exportLogs} aria-label="로그 내보내기">
              <FileDown className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Health Score 연동</span>
              <span>{Math.max(0, Math.min(100, latestScore))}/100</span>
            </div>
            <Progress value={Math.max(0, Math.min(100, latestScore))} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={unlockOpen} onOpenChange={(open) => {
        setUnlockOpen(open);
        if (!open) resetUnlockState();
      }}>
        <DialogContent className="p-0">
          <DialogHeader>
            <DialogTitle>지원자 PIN으로 Fail‑Safe 락 해제</DialogTitle>
            <DialogDescription>
              안전상 필요한 경우에만 수행하세요. 모든 해제 동작은 감사로그에 기록되어야 합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4 space-y-3">
            <div className="text-xs text-muted-foreground">
              현재 락 사유: <span className="font-mono text-foreground">{failSafeLock?.reason ?? "-"}</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Support PIN</div>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="•••••"
                disabled={inCooldown}
              />
              {unlockError && <div className="text-xs text-rose-600">{unlockError}</div>}
              {inCooldown && (
                <div className="text-[11px] text-muted-foreground">
                  쿨다운 종료까지 {Math.ceil((cooldownUntil - Date.now()) / 1000)}초
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleUnlock} disabled={inCooldown || pin.trim().length === 0}>
                해제
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setUnlockOpen(false)}>
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Signal Processing Log</CardTitle>
          <CardDescription>Raw vs Calibrated 데이터 처리 흐름(텍스트)</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea
            className={cn(
              "h-[28vh] rounded-xl border bg-background",
              logs.length === 0 && "flex items-center justify-center"
            )}
          >
            {logs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                아직 로그가 없습니다. Measure를 눌러주세요.
              </div>
            ) : (
              <div className="space-y-3 p-3 font-mono text-xs leading-relaxed">
                {logs
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div key={entry.ts} className="space-y-2">
                      <div className="text-muted-foreground">
                        {new Date(entry.ts).toLocaleString()}
                      </div>
                      <Separator />
                      <div className="whitespace-pre-wrap">
                        {entry.lines.map((l, idx) => {
                          const m = l.match(/^Measurement ID:\s*(.+)$/i);
                          if (m) {
                            const id = m[1]!.trim();
                            return (
                              <div key={`${entry.ts}-mid-${idx}`} className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground">-</span>
                                <span>Measurement ID:</span>
                                <Link
                                  href={`/deep-analysis/${encodeURIComponent(id)}`}
                                  prefetch={false}
                                  className="text-sky-700 underline underline-offset-2 hover:text-sky-900"
                                >
                                  {id}
                                </Link>
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-[11px]"
                                >
                                  <Link href={`/deep-analysis/${encodeURIComponent(id)}`} prefetch={false}>
                                    Deep 열기
                                  </Link>
                                </Button>
                              </div>
                            );
                          }
                          return (
                            <div key={`${entry.ts}-l-${idx}`}>
                              - {l}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}


