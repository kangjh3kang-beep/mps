"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  Activity, 
  Shield, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Gauge,
  Clock,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  systemDiagnostics,
  performanceMonitor,
  type SystemDiagnostics,
  type DiagnosticResult,
  type LatencyAlert,
  LATENCY_THRESHOLDS
} from "@/lib/performance";

interface SystemStatusProps {
  expanded?: boolean;
  onToggle?: () => void;
}

/**
 * System Status Panel
 * 
 * Part 5 Section 1.2: Edge Anomaly Detection 기반 시스템 상태 모니터링
 * - 시작 시 자동 진단
 * - 실시간 성능 모니터링
 * - 알림 표시
 */
export function SystemStatus({ expanded = false, onToggle }: SystemStatusProps) {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [alerts, setAlerts] = useState<LatencyAlert[]>([]);
  const [stats, setStats] = useState(performanceMonitor.getStats());

  // 시작 시 자동 진단
  useEffect(() => {
    runHealthCheck();

    // 알림 리스너 등록
    const unsubscribe = performanceMonitor.onAlert((alert) => {
      setAlerts(prev => [...prev.slice(-9), alert]);
    });

    // 주기적 통계 업데이트
    const statsInterval = setInterval(() => {
      setStats(performanceMonitor.getStats());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  const runHealthCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await systemDiagnostics.runDiagnostics();
      setDiagnostics(result);
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "checking":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    }
  };

  const getOverallStatusColor = (status: SystemDiagnostics["overallStatus"]) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
    }
  };

  const getOverallStatusText = (status: SystemDiagnostics["overallStatus"]) => {
    switch (status) {
      case "healthy":
        return "정상";
      case "degraded":
        return "주의";
      case "critical":
        return "위험";
    }
  };

  // 컴팩트 모드 (확장되지 않은 상태)
  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
      >
        <div className={`w-2 h-2 rounded-full ${
          diagnostics?.overallStatus === "healthy" ? "bg-green-500" :
          diagnostics?.overallStatus === "degraded" ? "bg-yellow-500" : "bg-red-500"
        } animate-pulse`} />
        <span className="text-muted-foreground">
          System: {diagnostics ? getOverallStatusText(diagnostics.overallStatus) : "확인 중..."}
        </span>
        {alerts.length > 0 && (
          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
            {alerts.length}
          </Badge>
        )}
      </button>
    );
  }

  return (
    <Card className="w-full max-w-sm shadow-xl border-t-4 border-t-primary bg-background/98 backdrop-blur-xl max-h-[calc(100vh-100px)] flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-primary" />
            시스템 상태
          </CardTitle>
          <div className="flex items-center gap-2">
            {diagnostics && (
              <Badge 
                className={`${getOverallStatusColor(diagnostics.overallStatus)} text-white`}
              >
                {getOverallStatusText(diagnostics.overallStatus)}
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={runHealthCheck}
              disabled={isChecking}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {/* 진단 체크리스트 */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            🔍 Self-Check Diagnostics
          </div>
          
          {diagnostics ? (
            <div className="space-y-2">
              {/* Database Connection */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {diagnostics.databaseConnection.value}
                  </span>
                  {getStatusIcon(diagnostics.databaseConnection.status)}
                </div>
              </div>

              {/* AI Model */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">AI Model</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {diagnostics.aiModelStatus.value}
                  </span>
                  {getStatusIcon(diagnostics.aiModelStatus.status)}
                </div>
              </div>

              {/* Sensor Integrity */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Sensor Integrity</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {diagnostics.sensorIntegrity.value}
                  </span>
                  {getStatusIcon(diagnostics.sensorIntegrity.status)}
                </div>
              </div>

              {/* Security Hash Chain */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Security Chain</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {diagnostics.securityHashChain.value}
                  </span>
                  {getStatusIcon(diagnostics.securityHashChain.status)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <Separator />

        {/* 성능 메트릭 */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            ⚡ Performance Metrics
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <div className="text-lg font-semibold">
                {stats.averageLatency.toFixed(0)}
                <span className="text-xs font-normal text-muted-foreground">ms</span>
              </div>
              <div className="text-xs text-muted-foreground">Avg Latency</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <div className="text-lg font-semibold">
                {stats.totalMeasurements}
              </div>
              <div className="text-xs text-muted-foreground">Total Ops</div>
            </div>
          </div>

          {/* E2E Latency Target */}
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" />
                E2E Target: {LATENCY_THRESHOLDS.TOTAL_E2E}ms
              </div>
              <span className={`text-xs font-medium ${
                stats.averageLatency <= LATENCY_THRESHOLDS.TOTAL_E2E 
                  ? "text-green-600" 
                  : "text-yellow-600"
              }`}>
                {stats.averageLatency <= LATENCY_THRESHOLDS.TOTAL_E2E ? "✓ OK" : "⚠ Slow"}
              </span>
            </div>
            <Progress 
              value={Math.min(100, (stats.averageLatency / LATENCY_THRESHOLDS.TOTAL_E2E) * 100)} 
              className="h-1.5"
            />
          </div>
        </div>

        {/* 최근 알림 */}
        {alerts.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">
                  ⚠️ Recent Alerts
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setAlerts([])}
                  className="h-6 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {alerts.slice().reverse().map((alert, i) => (
                  <div 
                    key={i}
                    className={`flex items-center gap-2 p-1.5 rounded text-xs ${
                      alert.severity === "critical" 
                        ? "bg-red-50 text-red-700" 
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span className="flex-1">{alert.phase}</span>
                    <span className="font-mono">{alert.measured.toFixed(0)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 마지막 확인 시간 */}
        {diagnostics && (
          <div className="text-center text-xs text-muted-foreground">
            마지막 확인: {new Date(diagnostics.lastChecked).toLocaleTimeString("ko-KR")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Floating System Status Button
 * 화면 우하단에 표시되는 시스템 상태 버튼 (다른 UI 요소와 겹침 방지)
 */
export function FloatingSystemStatus() {
  const [expanded, setExpanded] = useState(false);

  return (
    // 우하단에 배치하여 헤더 아이콘들과 겹치지 않도록 함
    <div className="fixed bottom-4 right-4 z-50 lg:bottom-6 lg:right-6">
      {expanded ? (
        <>
          {/* 배경 오버레이 - 클릭시 닫기 */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setExpanded(false)}
          />
          {/* 확장된 패널 - 우하단에서 위로 펼쳐짐 */}
          <div className="relative z-50 animate-in slide-in-from-bottom-4 fade-in">
            <div className="mb-2 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpanded(false)}
                className="h-7 bg-background/95 backdrop-blur-sm shadow-md"
              >
                닫기
              </Button>
            </div>
            <SystemStatus expanded onToggle={() => setExpanded(false)} />
          </div>
        </>
      ) : (
        <SystemStatus expanded={false} onToggle={() => setExpanded(true)} />
      )}
    </div>
  );
}

export default SystemStatus;





