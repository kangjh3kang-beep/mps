/**
 * Manpasik Immune System - AIOps & Self-Healing Engine
 * Zero-defect maintenance through AI-powered error analysis and auto-fixing
 */

/* ============================================
 * Types
 * ============================================ */

export interface CapturedError {
  id: string;
  timestamp: string;
  type: "frontend" | "backend" | "database" | "network" | "auth" | "unknown";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack: string;
  source: {
    file: string;
    line: number;
    column: number;
    function?: string;
  };
  context: {
    userId?: string;
    sessionId?: string;
    url?: string;
    userAgent?: string;
    requestId?: string;
    httpMethod?: string;
    httpStatus?: number;
    environment: "development" | "staging" | "production";
  };
  metadata?: Record<string, unknown>;
  fingerprint: string; // Hash for deduplication
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  status: "new" | "analyzing" | "patching" | "testing" | "deploying" | "resolved" | "ignored";
  resolution?: ErrorResolution;
}

export interface ErrorResolution {
  patchId: string;
  generatedAt: string;
  debuggerAnalysis: string;
  rootCause: string;
  suggestedFix: string;
  patchDiff: string;
  testResults?: TestResult;
  deploymentStatus: "pending" | "testing" | "passed" | "failed" | "deployed" | "rolled_back";
  deployedAt?: string;
  confidence: number;
}

export interface TestResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number; // ms
  coverage?: number; // percentage
  logs: string[];
}

export interface SelfHealingReport {
  id: string;
  timestamp: string;
  errorId: string;
  title: string;
  summary: string;
  severity: CapturedError["severity"];
  actions: {
    step: string;
    status: "success" | "failed" | "skipped";
    timestamp: string;
    details?: string;
  }[];
  outcome: "healed" | "escalated" | "manual_required";
  timeToResolve: number; // ms
  systemImpact: string;
}

export interface ChaosExperiment {
  id: string;
  name: string;
  description: string;
  type: "service_shutdown" | "latency_injection" | "memory_pressure" | "cpu_spike" | "network_partition" | "disk_full";
  target: string; // service or component name
  parameters: {
    duration?: number; // ms
    latencyMs?: number;
    failureRate?: number; // 0-1
    memoryMb?: number;
    cpuPercent?: number;
  };
  schedule: {
    enabled: boolean;
    cronExpression?: string; // e.g., "0 3 * * *" for 3 AM daily
    nextRun?: string;
    lastRun?: string;
  };
  status: "idle" | "running" | "completed" | "failed" | "scheduled";
  results?: ChaosResult;
}

export interface ChaosResult {
  startTime: string;
  endTime: string;
  success: boolean;
  systemBehavior: "resilient" | "degraded" | "failed";
  recoveryTime?: number; // ms
  observations: string[];
  recommendations: string[];
}

/* ============================================
 * Error Interception & Analysis
 * ============================================ */

// Global error store (in-memory for demo)
let errorStore: CapturedError[] = [];
let reportStore: SelfHealingReport[] = [];
let chaosStore: ChaosExperiment[] = [];

export function captureError(error: Error, context: Partial<CapturedError["context"]> = {}): CapturedError {
  const stack = error.stack ?? "";
  const source = parseStackTrace(stack);
  const fingerprint = generateFingerprint(error.message, source.file, source.function);
  
  // Check for existing error with same fingerprint
  const existing = errorStore.find(e => e.fingerprint === fingerprint);
  if (existing) {
    existing.occurrenceCount++;
    existing.lastSeen = new Date().toISOString();
    return existing;
  }

  const capturedError: CapturedError = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type: classifyError(error, source),
    severity: determineSeverity(error, source),
    message: error.message,
    stack,
    source,
    context: {
      environment: (process.env.NODE_ENV as any) ?? "development",
      ...context
    },
    fingerprint,
    occurrenceCount: 1,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    status: "new"
  };

  errorStore.push(capturedError);
  return capturedError;
}

function parseStackTrace(stack: string): CapturedError["source"] {
  const lines = stack.split("\n");
  // Parse first meaningful line (skip "Error: message" line)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Match patterns like "at functionName (file:line:col)" or "at file:line:col"
    const match = line.match(/at\s+(?:(.+?)\s+\()?(.+):(\d+):(\d+)\)?/);
    if (match) {
      return {
        function: match[1] ?? undefined,
        file: match[2],
        line: parseInt(match[3]),
        column: parseInt(match[4])
      };
    }
  }
  return { file: "unknown", line: 0, column: 0 };
}

function classifyError(error: Error, source: CapturedError["source"]): CapturedError["type"] {
  const message = error.message.toLowerCase();
  const file = source.file.toLowerCase();

  if (message.includes("database") || message.includes("sql") || message.includes("timeout") || message.includes("connection")) {
    return "database";
  }
  if (message.includes("network") || message.includes("fetch") || message.includes("econnrefused")) {
    return "network";
  }
  if (message.includes("auth") || message.includes("unauthorized") || message.includes("forbidden") || message.includes("token")) {
    return "auth";
  }
  if (file.includes("api/") || file.includes("server") || file.includes("route")) {
    return "backend";
  }
  if (file.includes("component") || file.includes("page") || file.includes("tsx")) {
    return "frontend";
  }
  return "unknown";
}

function determineSeverity(error: Error, source: CapturedError["source"]): CapturedError["severity"] {
  const message = error.message.toLowerCase();

  if (message.includes("critical") || message.includes("fatal") || message.includes("data corruption")) {
    return "critical";
  }
  if (message.includes("timeout") || message.includes("connection refused") || message.includes("503")) {
    return "high";
  }
  if (message.includes("warning") || message.includes("deprecated")) {
    return "low";
  }
  return "medium";
}

function generateFingerprint(message: string, file: string, func?: string): string {
  const normalized = `${message.replace(/\d+/g, "N")}|${file}|${func ?? ""}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

/* ============================================
 * Error Store API
 * ============================================ */

export function getErrors(filter?: { status?: CapturedError["status"]; severity?: CapturedError["severity"] }): CapturedError[] {
  let result = [...errorStore];
  if (filter?.status) {
    result = result.filter(e => e.status === filter.status);
  }
  if (filter?.severity) {
    result = result.filter(e => e.severity === filter.severity);
  }
  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getErrorById(id: string): CapturedError | undefined {
  return errorStore.find(e => e.id === id);
}

export function updateErrorStatus(id: string, status: CapturedError["status"], resolution?: ErrorResolution): void {
  const error = errorStore.find(e => e.id === id);
  if (error) {
    error.status = status;
    if (resolution) {
      error.resolution = resolution;
    }
  }
}

export function getReports(): SelfHealingReport[] {
  return [...reportStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function addReport(report: SelfHealingReport): void {
  reportStore.push(report);
}

/* ============================================
 * Mock Error Generator (for demo)
 * ============================================ */

export function generateMockErrors(): CapturedError[] {
  const mockErrors: CapturedError[] = [
    {
      id: "err_db_timeout_001",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: "database",
      severity: "critical",
      message: "Error: Database connection timeout after 30000ms",
      stack: `Error: Database connection timeout after 30000ms
    at DatabasePool.query (/app/lib/db.ts:45:12)
    at MeasurementService.save (/app/services/measurement.ts:78:23)
    at POST (/app/api/analyze/route.ts:34:5)`,
      source: { file: "/app/lib/db.ts", line: 45, column: 12, function: "DatabasePool.query" },
      context: { environment: "production", httpMethod: "POST", httpStatus: 500 },
      fingerprint: "fp_db_timeout",
      occurrenceCount: 47,
      firstSeen: new Date(Date.now() - 86400000).toISOString(),
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      status: "analyzing"
    },
    {
      id: "err_auth_token_002",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: "auth",
      severity: "high",
      message: "Error: JWT token expired or invalid",
      stack: `Error: JWT token expired or invalid
    at verifyToken (/app/lib/auth.ts:23:8)
    at middleware (/app/middleware.ts:15:12)`,
      source: { file: "/app/lib/auth.ts", line: 23, column: 8, function: "verifyToken" },
      context: { environment: "production", httpStatus: 401 },
      fingerprint: "fp_auth_jwt",
      occurrenceCount: 12,
      firstSeen: new Date(Date.now() - 43200000).toISOString(),
      lastSeen: new Date(Date.now() - 7200000).toISOString(),
      status: "resolved",
      resolution: {
        patchId: "patch_001",
        generatedAt: new Date(Date.now() - 6000000).toISOString(),
        debuggerAnalysis: "JWT verification failed due to clock skew between servers.",
        rootCause: "Server time synchronization issue causing JWT 'exp' validation to fail prematurely.",
        suggestedFix: "Add clock tolerance of 30 seconds to JWT verification.",
        patchDiff: `--- a/lib/auth.ts
+++ b/lib/auth.ts
@@ -22,7 +22,7 @@ export function verifyToken(token: string) {
-  return jwt.verify(token, SECRET);
+  return jwt.verify(token, SECRET, { clockTolerance: 30 });
 }`,
        testResults: { passed: true, totalTests: 15, passedTests: 15, failedTests: 0, duration: 2340, logs: ["All auth tests passed"] },
        deploymentStatus: "deployed",
        deployedAt: new Date(Date.now() - 5400000).toISOString(),
        confidence: 0.95
      }
    },
    {
      id: "err_frontend_render_003",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: "frontend",
      severity: "medium",
      message: "TypeError: Cannot read property 'map' of undefined",
      stack: `TypeError: Cannot read property 'map' of undefined
    at TrendChart (/app/components/dashboard/TrendChart.tsx:34:18)
    at renderWithHooks (/node_modules/react-dom/...`,
      source: { file: "/app/components/dashboard/TrendChart.tsx", line: 34, column: 18, function: "TrendChart" },
      context: { environment: "production", url: "/dashboard" },
      fingerprint: "fp_frontend_map",
      occurrenceCount: 5,
      firstSeen: new Date(Date.now() - 3600000).toISOString(),
      lastSeen: new Date(Date.now() - 1800000).toISOString(),
      status: "patching"
    },
    {
      id: "err_network_api_004",
      timestamp: new Date(Date.now() - 900000).toISOString(),
      type: "network",
      severity: "high",
      message: "Error: ECONNREFUSED - Connection refused to external API",
      stack: `Error: connect ECONNREFUSED 10.0.1.45:8080
    at TCPConnectWrap.afterConnect [as oncomplete]
    at ExternalApiClient.fetch (/app/lib/external-api.ts:56:10)`,
      source: { file: "/app/lib/external-api.ts", line: 56, column: 10, function: "ExternalApiClient.fetch" },
      context: { environment: "production", httpMethod: "GET" },
      fingerprint: "fp_network_conn",
      occurrenceCount: 23,
      firstSeen: new Date(Date.now() - 1800000).toISOString(),
      lastSeen: new Date(Date.now() - 900000).toISOString(),
      status: "new"
    }
  ];

  errorStore = mockErrors;
  return mockErrors;
}

export function generateMockReports(): SelfHealingReport[] {
  const mockReports: SelfHealingReport[] = [
    {
      id: "report_001",
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      errorId: "err_auth_token_002",
      title: "Self-Healed: JWT Token Validation Issue",
      summary: "Fixed critical authentication failure affecting 12 users. Added clock tolerance to JWT verification.",
      severity: "high",
      actions: [
        { step: "Error Captured", status: "success", timestamp: new Date(Date.now() - 7200000).toISOString() },
        { step: "Stack Trace Analyzed", status: "success", timestamp: new Date(Date.now() - 7100000).toISOString() },
        { step: "Root Cause Identified", status: "success", timestamp: new Date(Date.now() - 7000000).toISOString(), details: "Clock skew between auth server and app server" },
        { step: "Patch Generated", status: "success", timestamp: new Date(Date.now() - 6800000).toISOString() },
        { step: "Sandboxed Tests Run", status: "success", timestamp: new Date(Date.now() - 6500000).toISOString(), details: "15/15 tests passed" },
        { step: "Hotfix Deployed", status: "success", timestamp: new Date(Date.now() - 5400000).toISOString() }
      ],
      outcome: "healed",
      timeToResolve: 1800000, // 30 min
      systemImpact: "Authentication restored. No further JWT errors detected."
    },
    {
      id: "report_002",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      errorId: "err_memory_leak",
      title: "Self-Healed: Memory Leak in Chart Component",
      summary: "Detected and fixed memory leak in TrendChart component causing gradual slowdown.",
      severity: "medium",
      actions: [
        { step: "Error Captured", status: "success", timestamp: new Date(Date.now() - 90000000).toISOString() },
        { step: "Memory Profile Analyzed", status: "success", timestamp: new Date(Date.now() - 89000000).toISOString() },
        { step: "Leak Source Identified", status: "success", timestamp: new Date(Date.now() - 88000000).toISOString(), details: "Event listener not cleaned up in useEffect" },
        { step: "Patch Generated", status: "success", timestamp: new Date(Date.now() - 87500000).toISOString() },
        { step: "Sandboxed Tests Run", status: "success", timestamp: new Date(Date.now() - 87000000).toISOString() },
        { step: "Hotfix Deployed", status: "success", timestamp: new Date(Date.now() - 86400000).toISOString() }
      ],
      outcome: "healed",
      timeToResolve: 3600000, // 1 hour
      systemImpact: "Memory usage stabilized. Performance improved by 15%."
    }
  ];

  reportStore = mockReports;
  return mockReports;
}

/* ============================================
 * Chaos Monkey
 * ============================================ */

export function getChaosExperiments(): ChaosExperiment[] {
  return [...chaosStore];
}

export function initializeChaosExperiments(): ChaosExperiment[] {
  const experiments: ChaosExperiment[] = [
    {
      id: "chaos_db_shutdown",
      name: "Database Service Shutdown",
      description: "Temporarily shut down database connection to test fallback and retry logic",
      type: "service_shutdown",
      target: "PostgreSQL Primary",
      parameters: { duration: 30000 },
      schedule: { enabled: true, cronExpression: "0 3 * * 0", nextRun: getNextSunday3AM() },
      status: "scheduled"
    },
    {
      id: "chaos_api_latency",
      name: "External API Latency Injection",
      description: "Inject 2000ms latency to external API calls to test timeout handling",
      type: "latency_injection",
      target: "External Health API",
      parameters: { duration: 60000, latencyMs: 2000 },
      schedule: { enabled: true, cronExpression: "0 4 * * 3", nextRun: getNextWednesday4AM() },
      status: "scheduled"
    },
    {
      id: "chaos_memory",
      name: "Memory Pressure Test",
      description: "Gradually increase memory usage to test garbage collection and OOM handling",
      type: "memory_pressure",
      target: "API Server",
      parameters: { duration: 120000, memoryMb: 512 },
      schedule: { enabled: false },
      status: "idle"
    },
    {
      id: "chaos_cpu",
      name: "CPU Spike Simulation",
      description: "Simulate 90% CPU usage to test request queuing and timeouts",
      type: "cpu_spike",
      target: "Worker Nodes",
      parameters: { duration: 45000, cpuPercent: 90 },
      schedule: { enabled: false },
      status: "idle"
    },
    {
      id: "chaos_network",
      name: "Network Partition",
      description: "Simulate network partition between API server and database",
      type: "network_partition",
      target: "API <-> DB Connection",
      parameters: { duration: 20000, failureRate: 0.5 },
      schedule: { enabled: true, cronExpression: "0 2 * * 6", nextRun: getNextSaturday2AM() },
      status: "scheduled"
    }
  ];

  chaosStore = experiments;
  return experiments;
}

function getNextSunday3AM(): string {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(3, 0, 0, 0);
  return nextSunday.toISOString();
}

function getNextWednesday4AM(): string {
  const now = new Date();
  const daysUntilWed = (3 - now.getDay() + 7) % 7 || 7;
  const nextWed = new Date(now);
  nextWed.setDate(now.getDate() + daysUntilWed);
  nextWed.setHours(4, 0, 0, 0);
  return nextWed.toISOString();
}

function getNextSaturday2AM(): string {
  const now = new Date();
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
  const nextSat = new Date(now);
  nextSat.setDate(now.getDate() + daysUntilSat);
  nextSat.setHours(2, 0, 0, 0);
  return nextSat.toISOString();
}

export async function runChaosExperiment(experimentId: string): Promise<ChaosResult> {
  const experiment = chaosStore.find(e => e.id === experimentId);
  if (!experiment) throw new Error("Experiment not found");

  // Update status
  experiment.status = "running";

  // Simulate experiment running
  const startTime = new Date().toISOString();
  await new Promise(r => setTimeout(r, 3000)); // Simulate 3 second experiment

  // Generate mock results
  const success = Math.random() > 0.2; // 80% success rate
  const result: ChaosResult = {
    startTime,
    endTime: new Date().toISOString(),
    success,
    systemBehavior: success ? "resilient" : Math.random() > 0.5 ? "degraded" : "failed",
    recoveryTime: success ? Math.floor(Math.random() * 5000) + 1000 : undefined,
    observations: success
      ? [
          "System detected failure within 500ms",
          "Failover mechanism activated successfully",
          "Request retries handled gracefully",
          "No data loss detected"
        ]
      : [
          "System failed to detect failure in time",
          "Failover mechanism did not activate",
          "Some requests were lost"
        ],
    recommendations: success
      ? ["Current resilience configuration is adequate", "Consider reducing detection threshold for faster response"]
      : ["Implement circuit breaker pattern", "Add health check probes", "Configure retry with exponential backoff"]
  };

  experiment.status = "completed";
  experiment.results = result;
  experiment.schedule.lastRun = startTime;

  return result;
}

export function updateExperimentSchedule(experimentId: string, enabled: boolean): void {
  const experiment = chaosStore.find(e => e.id === experimentId);
  if (experiment) {
    experiment.schedule.enabled = enabled;
    experiment.status = enabled ? "scheduled" : "idle";
  }
}






