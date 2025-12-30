/**
 * Performance Monitoring System
 * 
 * Part 5 Section 1.2: Edge Anomaly Detection
 * - End-to-End Latency 측정
 * - 성능 임계값 모니터링
 * - 실시간 진단
 */

/* ============================================
 * 1. Types & Interfaces
 * ============================================
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "running" | "completed" | "failed" | "warning";
  metadata?: Record<string, unknown>;
}

export interface LatencyAlert {
  timestamp: number;
  phase: string;
  measured: number;
  threshold: number;
  severity: "warning" | "critical";
}

export interface SystemDiagnostics {
  databaseConnection: DiagnosticResult;
  aiModelStatus: DiagnosticResult;
  sensorIntegrity: DiagnosticResult;
  securityHashChain: DiagnosticResult;
  overallStatus: "healthy" | "degraded" | "critical";
  lastChecked: number;
}

export interface DiagnosticResult {
  status: "ok" | "warning" | "error" | "checking";
  message: string;
  value?: number | string;
  lastChecked: number;
}

/* ============================================
 * 2. Performance Thresholds (Part 5 Spec)
 * ============================================
 */

export const LATENCY_THRESHOLDS = {
  // End-to-End: measure -> analyze -> coach
  TOTAL_E2E: 200,           // 200ms 모바일 처리 목표
  MEASURE_PHASE: 50,        // 센서 측정
  ANALYZE_PHASE: 100,       // API 분석
  COACH_PHASE: 50,          // AI 코칭 응답
  
  // Individual operations
  KALMAN_FILTER: 10,        // 칼만 필터 연산
  API_CALL: 150,            // API 호출
  UI_RENDER: 16,            // 60fps 기준
} as const;

/* ============================================
 * 3. Performance Monitor Class
 * ============================================
 */

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private alerts: LatencyAlert[] = [];
  private listeners: ((alert: LatencyAlert) => void)[] = [];
  private enabled: boolean = true;

  /**
   * 성능 측정 시작
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      status: "running",
      metadata
    };
    this.metrics.set(name, metric);

    console.debug(`[Perf] ▶ ${name} started`);
  }

  /**
   * 성능 측정 종료
   */
  end(name: string, threshold?: number): PerformanceMetric | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[Perf] Metric "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.status = "completed";

    // 임계값 체크
    const actualThreshold = threshold ?? this.getDefaultThreshold(name);
    if (actualThreshold && metric.duration > actualThreshold) {
      metric.status = "warning";
      this.addAlert(name, metric.duration, actualThreshold);
    }

    console.debug(
      `[Perf] ✓ ${name} completed: ${metric.duration.toFixed(2)}ms` +
      (metric.status === "warning" ? ` ⚠️ (threshold: ${actualThreshold}ms)` : "")
    );

    return metric;
  }

  /**
   * 측정 실패 표시
   */
  fail(name: string, error?: Error): void {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.status = "failed";
      metric.metadata = { ...metric.metadata, error: error?.message };
    }
    console.error(`[Perf] ✗ ${name} failed:`, error);
  }

  /**
   * End-to-End 측정 (measure -> analyze -> coach)
   */
  measureE2E<T>(
    operation: () => Promise<T>,
    phases?: { measure?: number; analyze?: number; coach?: number }
  ): Promise<{ result: T; metrics: PerformanceMetric }> {
    return new Promise(async (resolve, reject) => {
      this.start("E2E_TOTAL");
      
      try {
        const result = await operation();
        const metric = this.end("E2E_TOTAL", LATENCY_THRESHOLDS.TOTAL_E2E);
        
        resolve({ 
          result, 
          metrics: metric ?? {
            name: "E2E_TOTAL",
            startTime: 0,
            status: "completed",
            duration: 0
          }
        });
      } catch (error) {
        this.fail("E2E_TOTAL", error as Error);
        reject(error);
      }
    });
  }

  /**
   * 알림 추가
   */
  private addAlert(phase: string, measured: number, threshold: number): void {
    const severity = measured > threshold * 2 ? "critical" : "warning";
    const alert: LatencyAlert = {
      timestamp: Date.now(),
      phase,
      measured,
      threshold,
      severity
    };

    this.alerts.push(alert);
    
    // 최대 100개까지만 유지
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // 리스너에게 알림
    this.listeners.forEach(listener => listener(alert));

    console.warn(
      `[Perf] ⚠️ Latency Alert: ${phase} took ${measured.toFixed(2)}ms ` +
      `(threshold: ${threshold}ms, severity: ${severity})`
    );
  }

  /**
   * 기본 임계값 조회
   */
  private getDefaultThreshold(name: string): number | undefined {
    const thresholdMap: Record<string, number> = {
      "E2E_TOTAL": LATENCY_THRESHOLDS.TOTAL_E2E,
      "MEASURE": LATENCY_THRESHOLDS.MEASURE_PHASE,
      "ANALYZE": LATENCY_THRESHOLDS.ANALYZE_PHASE,
      "COACH": LATENCY_THRESHOLDS.COACH_PHASE,
      "KALMAN": LATENCY_THRESHOLDS.KALMAN_FILTER,
      "API_CALL": LATENCY_THRESHOLDS.API_CALL,
    };
    return thresholdMap[name];
  }

  /**
   * 알림 리스너 등록
   */
  onAlert(callback: (alert: LatencyAlert) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * 최근 알림 조회
   */
  getRecentAlerts(limit = 10): LatencyAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * 메트릭 통계
   */
  getStats(): {
    totalMeasurements: number;
    averageLatency: number;
    warningCount: number;
    failureCount: number;
  } {
    const metrics = Array.from(this.metrics.values());
    const completed = metrics.filter(m => m.status === "completed" || m.status === "warning");
    
    return {
      totalMeasurements: metrics.length,
      averageLatency: completed.length > 0
        ? completed.reduce((sum, m) => sum + (m.duration ?? 0), 0) / completed.length
        : 0,
      warningCount: metrics.filter(m => m.status === "warning").length,
      failureCount: metrics.filter(m => m.status === "failed").length
    };
  }

  /**
   * 모니터링 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 초기화
   */
  reset(): void {
    this.metrics.clear();
    this.alerts = [];
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

/* ============================================
 * 4. System Diagnostics
 * ============================================
 */

class SystemDiagnosticsManager {
  private diagnostics: SystemDiagnostics = this.getInitialState();
  private listeners: ((diagnostics: SystemDiagnostics) => void)[] = [];

  private getInitialState(): SystemDiagnostics {
    return {
      databaseConnection: { status: "checking", message: "확인 중...", lastChecked: 0 },
      aiModelStatus: { status: "checking", message: "확인 중...", lastChecked: 0 },
      sensorIntegrity: { status: "checking", message: "확인 중...", lastChecked: 0 },
      securityHashChain: { status: "checking", message: "확인 중...", lastChecked: 0 },
      overallStatus: "healthy",
      lastChecked: 0
    };
  }

  /**
   * 전체 시스템 진단 실행
   */
  async runDiagnostics(): Promise<SystemDiagnostics> {
    console.log("[Diagnostics] Running system health check...");
    performanceMonitor.start("DIAGNOSTICS");

    const now = Date.now();

    // 병렬로 모든 진단 실행
    const [db, ai, sensor, security] = await Promise.all([
      this.checkDatabaseConnection(),
      this.checkAIModelStatus(),
      this.checkSensorIntegrity(),
      this.checkSecurityHashChain()
    ]);

    this.diagnostics = {
      databaseConnection: { ...db, lastChecked: now },
      aiModelStatus: { ...ai, lastChecked: now },
      sensorIntegrity: { ...sensor, lastChecked: now },
      securityHashChain: { ...security, lastChecked: now },
      overallStatus: this.calculateOverallStatus([db, ai, sensor, security]),
      lastChecked: now
    };

    performanceMonitor.end("DIAGNOSTICS");
    this.notifyListeners();

    console.log("[Diagnostics] Health check complete:", this.diagnostics.overallStatus);
    return this.diagnostics;
  }

  /**
   * 데이터베이스 연결 확인 (모킹)
   */
  private async checkDatabaseConnection(): Promise<Omit<DiagnosticResult, "lastChecked">> {
    await this.simulateDelay(100);
    
    // 모킹: 95% 확률로 성공
    if (Math.random() > 0.05) {
      return { status: "ok", message: "Connected", value: "LocalStorage OK" };
    }
    return { status: "warning", message: "Slow response", value: "Retry recommended" };
  }

  /**
   * AI 모델 상태 확인 (모킹)
   */
  private async checkAIModelStatus(): Promise<Omit<DiagnosticResult, "lastChecked">> {
    await this.simulateDelay(150);
    
    // 모킹: 항상 온라인
    return { status: "ok", message: "Online", value: "RAG Model v1.0" };
  }

  /**
   * 센서 무결성 확인 (모킹)
   */
  private async checkSensorIntegrity(): Promise<Omit<DiagnosticResult, "lastChecked">> {
    await this.simulateDelay(80);
    
    // 모킹: 무결성 점수 계산
    const integrity = 95 + Math.random() * 5; // 95-100%
    const status = integrity >= 98 ? "ok" : integrity >= 90 ? "warning" : "error";
    
    return { 
      status, 
      message: status === "ok" ? "Verified" : "Calibration needed",
      value: `${integrity.toFixed(1)}%` 
    };
  }

  /**
   * 보안 해시 체인 확인 (모킹)
   */
  private async checkSecurityHashChain(): Promise<Omit<DiagnosticResult, "lastChecked">> {
    await this.simulateDelay(120);

    // Audit Trail integrity (Part 11): verify append-only checksum chain
    try {
      const { auditLogger } = await import("./audit-logger");
      const r = await auditLogger.verifyChain();
      if (!r.ok) {
        return { status: "error", message: "Data Integrity Breach", value: "Audit chain broken" };
      }
      return { status: "ok", message: "Verified", value: `Audit OK (${r.count})` };
    } catch {
      // If verification isn't available (SSR), keep as warning rather than failing hard.
      return { status: "warning", message: "Deferred", value: "Audit verify pending" };
    }
  }

  /**
   * 전체 상태 계산
   */
  private calculateOverallStatus(
    results: Omit<DiagnosticResult, "lastChecked">[]
  ): "healthy" | "degraded" | "critical" {
    const hasError = results.some(r => r.status === "error");
    const hasWarning = results.some(r => r.status === "warning");
    
    if (hasError) return "critical";
    if (hasWarning) return "degraded";
    return "healthy";
  }

  /**
   * 딜레이 시뮬레이션
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 현재 진단 상태 조회
   */
  getDiagnostics(): SystemDiagnostics {
    return this.diagnostics;
  }

  /**
   * 리스너 등록
   */
  onUpdate(callback: (diagnostics: SystemDiagnostics) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * 리스너 알림
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.diagnostics));
  }
}

// 싱글톤 인스턴스
export const systemDiagnostics = new SystemDiagnosticsManager();

/* ============================================
 * 5. Performance Hooks (React)
 * ============================================
 */

/**
 * React Hook: 성능 측정 유틸리티
 */
export function usePerformance() {
  const measure = <T>(
    name: string,
    operation: () => T,
    threshold?: number
  ): T => {
    performanceMonitor.start(name);
    try {
      const result = operation();
      performanceMonitor.end(name, threshold);
      return result;
    } catch (error) {
      performanceMonitor.fail(name, error as Error);
      throw error;
    }
  };

  const measureAsync = async <T>(
    name: string,
    operation: () => Promise<T>,
    threshold?: number
  ): Promise<T> => {
    performanceMonitor.start(name);
    try {
      const result = await operation();
      performanceMonitor.end(name, threshold);
      return result;
    } catch (error) {
      performanceMonitor.fail(name, error as Error);
      throw error;
    }
  };

  return {
    measure,
    measureAsync,
    start: performanceMonitor.start.bind(performanceMonitor),
    end: performanceMonitor.end.bind(performanceMonitor),
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    getAlerts: performanceMonitor.getRecentAlerts.bind(performanceMonitor)
  };
}

