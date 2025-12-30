"use client";

import * as React from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  Bug,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Database,
  Eye,
  FileCode,
  FlaskConical,
  GitBranch,
  Heart,
  Loader2,
  Network,
  Play,
  Power,
  RefreshCw,
  Rocket,
  Server,
  Shield,
  ShieldCheck,
  Skull,
  Sparkles,
  Target,
  Terminal,
  Timer,
  TrendingUp,
  Waves,
  Wrench,
  X,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  type CapturedError,
  type SelfHealingReport,
  type ChaosExperiment,
  generateMockErrors,
  generateMockReports,
  getErrors,
  getReports,
  getChaosExperiments,
  initializeChaosExperiments,
  runChaosExperiment,
  updateExperimentSchedule
} from "@/lib/aiops-engine";
import { startDebugging, getDebugSession, type DebugSession } from "@/lib/debugger-agent";

export default function AIOpsPage() {
  const [errors, setErrors] = React.useState<CapturedError[]>([]);
  const [reports, setReports] = React.useState<SelfHealingReport[]>([]);
  const [chaosExperiments, setChaosExperiments] = React.useState<ChaosExperiment[]>([]);
  const [selectedError, setSelectedError] = React.useState<CapturedError | null>(null);
  const [debugSession, setDebugSession] = React.useState<DebugSession | null>(null);
  const [runningChaos, setRunningChaos] = React.useState<string | null>(null);

  // Initialize data
  React.useEffect(() => {
    generateMockErrors();
    generateMockReports();
    initializeChaosExperiments();

    setErrors(getErrors());
    setReports(getReports());
    setChaosExperiments(getChaosExperiments());
  }, []);

  // Poll for debug session updates
  React.useEffect(() => {
    if (!selectedError) return;

    const interval = setInterval(() => {
      const session = getDebugSession(selectedError.id);
      if (session) {
        setDebugSession({ ...session });
        if (session.status === "complete" || session.status === "failed") {
          setErrors(getErrors());
          setReports(getReports());
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [selectedError]);

  const handleStartDebug = async (error: CapturedError) => {
    setSelectedError(error);
    const session = await startDebugging(error);
    setDebugSession(session);
  };

  const handleRunChaos = async (experimentId: string) => {
    setRunningChaos(experimentId);
    await runChaosExperiment(experimentId);
    setChaosExperiments(getChaosExperiments());
    setRunningChaos(null);
  };

  const handleToggleChaos = (experimentId: string, enabled: boolean) => {
    updateExperimentSchedule(experimentId, enabled);
    setChaosExperiments(getChaosExperiments());
  };

  const criticalErrors = errors.filter(e => e.severity === "critical" && e.status !== "resolved");
  const healedToday = reports.filter(r => {
    const today = new Date().toDateString();
    return new Date(r.timestamp).toDateString() === today && r.outcome === "healed";
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-400" />
            Manpasik Immune System
          </h1>
          <p className="text-slate-400 text-sm">AIOps & Self-Healing Engine for Zero-Defect Maintenance</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 animate-pulse">
            <Heart className="h-3 w-3 mr-1" />
            System Healthy
          </Badge>
          <Button
            variant="outline"
            className="border-slate-700"
            onClick={() => {
              setErrors(getErrors());
              setReports(getReports());
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalErrors.length > 0 && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-6 w-6 text-rose-400" />
            <div>
              <div className="font-medium text-rose-300">
                {criticalErrors.length} Critical Error{criticalErrors.length > 1 ? "s" : ""} Detected
              </div>
              <div className="text-sm text-rose-400/80">
                Self-healing agent is analyzing and generating patches
              </div>
            </div>
          </div>
          <Button
            className="bg-rose-600 hover:bg-rose-700"
            onClick={() => criticalErrors[0] && handleStartDebug(criticalErrors[0])}
          >
            <Bot className="h-4 w-4 mr-2" />
            Start Auto-Fix
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Errors"
          value={errors.length}
          icon={<Bug className="h-5 w-5" />}
          color="slate"
        />
        <StatCard
          title="Critical"
          value={criticalErrors.length}
          icon={<AlertOctagon className="h-5 w-5" />}
          color="rose"
          alert={criticalErrors.length > 0}
        />
        <StatCard
          title="Self-Healed"
          value={reports.filter(r => r.outcome === "healed").length}
          icon={<ShieldCheck className="h-5 w-5" />}
          color="emerald"
        />
        <StatCard
          title="Avg Heal Time"
          value="< 30 min"
          icon={<Timer className="h-5 w-5" />}
          color="cyan"
          isText
        />
      </div>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="errors" className="data-[state=active]:bg-slate-700">
            Error Queue
            {criticalErrors.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                {criticalErrors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="debugger" className="data-[state=active]:bg-slate-700">
            Debugger Agent
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-slate-700">
            Healing Reports
          </TabsTrigger>
          <TabsTrigger value="chaos" className="data-[state=active]:bg-slate-700">
            Chaos Monkey
          </TabsTrigger>
        </TabsList>

        {/* Error Queue Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bug className="h-4 w-4 text-amber-400" />
                Captured Errors
              </CardTitle>
              <CardDescription>
                Real-time error interception from frontend and backend
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800">
                {errors.map(error => (
                  <div
                    key={error.id}
                    className={cn(
                      "p-4 hover:bg-slate-800/30 transition-colors",
                      error.severity === "critical" && error.status !== "resolved" && "bg-rose-500/5"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <ErrorTypeIcon type={error.type} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono text-rose-400">{error.message.slice(0, 60)}...</code>
                            <SeverityBadge severity={error.severity} />
                            <StatusBadge status={error.status} />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="font-mono">{error.source.file}:{error.source.line}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(error.lastSeen).toLocaleString()}
                            </span>
                            <span>×{error.occurrenceCount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {error.status === "resolved" ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Healed
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleStartDebug(error)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Bot className="h-3 w-3 mr-1" />
                            Debug
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Show resolution if available */}
                    {error.resolution && (
                      <div className="mt-3 ml-14 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-xs font-medium text-emerald-400 mb-1">Resolution Applied</div>
                        <p className="text-xs text-slate-400">{error.resolution.suggestedFix}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          <span>Confidence: {Math.round(error.resolution.confidence * 100)}%</span>
                          <span>Deployed: {new Date(error.resolution.deployedAt!).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debugger Agent Tab */}
        <TabsContent value="debugger" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Debug Session */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4 text-purple-400" />
                  Debugger Agent Session
                </CardTitle>
                <CardDescription>
                  AI-powered error analysis and auto-fix generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!debugSession ? (
                  <div className="text-center py-12 text-slate-400">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No active debug session</p>
                    <p className="text-xs mt-1">Select an error from the queue to start debugging</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          debugSession.status === "complete" ? "bg-emerald-500/20 text-emerald-400" :
                          debugSession.status === "failed" ? "bg-rose-500/20 text-rose-400" :
                          "bg-purple-500/20 text-purple-400"
                        )}>
                          {debugSession.status === "complete" ? <CheckCircle className="h-3 w-3 mr-1" /> :
                           debugSession.status === "failed" ? <X className="h-3 w-3 mr-1" /> :
                           <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {debugSession.status}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          Error: {selectedError?.id}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {debugSession.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all",
                            step.status === "running" && "bg-purple-500/10 border border-purple-500/30",
                            step.status === "success" && "bg-emerald-500/5",
                            step.status === "failed" && "bg-rose-500/5"
                          )}
                        >
                          <StepIcon status={step.status} />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{step.name}</div>
                            {step.output && (
                              <div className="text-xs text-slate-400 mt-0.5">{step.output}</div>
                            )}
                          </div>
                          {step.endTime && step.startTime && (
                            <span className="text-[10px] text-slate-500">
                              {new Date(step.endTime).getTime() - new Date(step.startTime).getTime()}ms
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patch Preview */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileCode className="h-4 w-4 text-cyan-400" />
                  Generated Patch
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedError?.resolution?.patchDiff ? (
                  <ScrollArea className="h-[300px]">
                    <pre className="text-xs font-mono p-4 bg-slate-950 rounded-lg overflow-x-auto">
                      {selectedError.resolution.patchDiff.split("\n").map((line, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            line.startsWith("+") && !line.startsWith("+++") && "text-emerald-400 bg-emerald-500/10",
                            line.startsWith("-") && !line.startsWith("---") && "text-rose-400 bg-rose-500/10",
                            line.startsWith("@@") && "text-cyan-400"
                          )}
                        >
                          {line}
                        </div>
                      ))}
                    </pre>
                  </ScrollArea>
                ) : debugSession?.steps[3]?.details?.diff ? (
                  <ScrollArea className="h-[300px]">
                    <pre className="text-xs font-mono p-4 bg-slate-950 rounded-lg overflow-x-auto">
                      {(debugSession.steps[3].details.diff as string).split("\n").map((line, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            line.startsWith("+") && !line.startsWith("+++") && "text-emerald-400 bg-emerald-500/10",
                            line.startsWith("-") && !line.startsWith("---") && "text-rose-400 bg-rose-500/10",
                            line.startsWith("@@") && "text-cyan-400"
                          )}
                        >
                          {line}
                        </div>
                      ))}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patch generated yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Healing Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Self-Healing Reports
              </CardTitle>
              <CardDescription>
                Complete audit trail of automated fixes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800">
                {reports.map(report => (
                  <div key={report.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{report.title}</span>
                          <SeverityBadge severity={report.severity} />
                          <Badge className={cn(
                            report.outcome === "healed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          )}>
                            {report.outcome}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{report.summary}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <div>{new Date(report.timestamp).toLocaleString()}</div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Timer className="h-3 w-3" />
                          {Math.round(report.timeToResolve / 60000)} min
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {report.actions.map((action, idx) => (
                        <React.Fragment key={idx}>
                          <div className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] whitespace-nowrap",
                            action.status === "success" ? "bg-emerald-500/20 text-emerald-400" :
                            action.status === "failed" ? "bg-rose-500/20 text-rose-400" :
                            "bg-slate-500/20 text-slate-400"
                          )}>
                            {action.status === "success" ? <Check className="h-2.5 w-2.5" /> :
                             action.status === "failed" ? <X className="h-2.5 w-2.5" /> :
                             <ArrowRight className="h-2.5 w-2.5" />}
                            {action.step}
                          </div>
                          {idx < report.actions.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chaos Monkey Tab */}
        <TabsContent value="chaos" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Skull className="h-4 w-4 text-amber-400" />
                    Chaos Monkey
                  </CardTitle>
                  <CardDescription>
                    Proactive stress testing to train system resilience
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                  <Calendar className="h-3 w-3 mr-1" />
                  Non-Peak Hours Only
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chaosExperiments.map(experiment => (
                  <div
                    key={experiment.id}
                    className={cn(
                      "rounded-xl border p-4",
                      experiment.status === "running" && "border-amber-500/50 bg-amber-500/5 animate-pulse",
                      experiment.schedule.enabled && "border-emerald-500/30 bg-emerald-500/5",
                      !experiment.schedule.enabled && "border-slate-700 bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ChaosTypeIcon type={experiment.type} />
                        <div>
                          <div className="font-medium text-sm">{experiment.name}</div>
                          <div className="text-xs text-slate-400">{experiment.target}</div>
                        </div>
                      </div>
                      <Switch
                        checked={experiment.schedule.enabled}
                        onCheckedChange={(enabled) => handleToggleChaos(experiment.id, enabled)}
                        disabled={experiment.status === "running"}
                      />
                    </div>

                    <p className="text-xs text-slate-400 mb-3">{experiment.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-slate-500">
                        {experiment.schedule.enabled && experiment.schedule.nextRun && (
                          <span>Next: {new Date(experiment.schedule.nextRun).toLocaleString()}</span>
                        )}
                        {experiment.schedule.lastRun && (
                          <span className="ml-2">Last: {new Date(experiment.schedule.lastRun).toLocaleDateString()}</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunChaos(experiment.id)}
                        disabled={runningChaos !== null}
                        className="h-7 text-xs border-slate-600"
                      >
                        {runningChaos === experiment.id ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running...</>
                        ) : (
                          <><Play className="h-3 w-3 mr-1" /> Run Now</>
                        )}
                      </Button>
                    </div>

                    {/* Results */}
                    {experiment.results && (
                      <div className={cn(
                        "mt-3 p-3 rounded-lg text-xs",
                        experiment.results.success
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-rose-500/10 border border-rose-500/20"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={cn(
                            experiment.results.systemBehavior === "resilient"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : experiment.results.systemBehavior === "degraded"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-rose-500/20 text-rose-400"
                          )}>
                            {experiment.results.systemBehavior}
                          </Badge>
                          {experiment.results.recoveryTime && (
                            <span className="text-slate-400">
                              Recovery: {experiment.results.recoveryTime}ms
                            </span>
                          )}
                        </div>
                        <ul className="space-y-1 text-slate-400">
                          {experiment.results.observations.slice(0, 2).map((obs, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className={experiment.results!.success ? "text-emerald-400" : "text-rose-400"}>
                                {experiment.results!.success ? "✓" : "✗"}
                              </span>
                              {obs}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================
 * Sub-components
 * ============================================ */

function StatCard({
  title,
  value,
  icon,
  color,
  alert,
  isText
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  alert?: boolean;
  isText?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
    slate: "text-slate-400"
  };

  return (
    <Card className={cn("bg-slate-900 border-slate-800", alert && "border-rose-500/50")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={colorClasses[color]}>{icon}</span>
        </div>
        <div className={cn("font-bold", isText ? "text-lg" : "text-2xl")}>{value}</div>
        <div className="text-xs text-slate-400 mt-1">{title}</div>
      </CardContent>
    </Card>
  );
}

function ErrorTypeIcon({ type }: { type: CapturedError["type"] }) {
  const configs: Record<string, { color: string; icon: React.ReactNode }> = {
    database: { color: "bg-purple-500/20", icon: <Database className="h-5 w-5 text-purple-400" /> },
    network: { color: "bg-cyan-500/20", icon: <Network className="h-5 w-5 text-cyan-400" /> },
    auth: { color: "bg-amber-500/20", icon: <Shield className="h-5 w-5 text-amber-400" /> },
    frontend: { color: "bg-blue-500/20", icon: <Waves className="h-5 w-5 text-blue-400" /> },
    backend: { color: "bg-emerald-500/20", icon: <Server className="h-5 w-5 text-emerald-400" /> },
    unknown: { color: "bg-slate-500/20", icon: <Bug className="h-5 w-5 text-slate-400" /> }
  };

  const config = configs[type] ?? configs.unknown;

  return (
    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", config.color)}>
      {config.icon}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: CapturedError["severity"] }) {
  const configs: Record<string, string> = {
    critical: "bg-rose-500/20 text-rose-400",
    high: "bg-orange-500/20 text-orange-400",
    medium: "bg-amber-500/20 text-amber-400",
    low: "bg-slate-500/20 text-slate-400"
  };

  return <Badge className={configs[severity]}>{severity}</Badge>;
}

function StatusBadge({ status }: { status: CapturedError["status"] }) {
  const configs: Record<string, { color: string; icon?: React.ReactNode }> = {
    new: { color: "bg-blue-500/20 text-blue-400" },
    analyzing: { color: "bg-purple-500/20 text-purple-400", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    patching: { color: "bg-amber-500/20 text-amber-400", icon: <Wrench className="h-3 w-3" /> },
    testing: { color: "bg-cyan-500/20 text-cyan-400", icon: <FlaskConical className="h-3 w-3" /> },
    deploying: { color: "bg-emerald-500/20 text-emerald-400", icon: <Rocket className="h-3 w-3" /> },
    resolved: { color: "bg-emerald-500/20 text-emerald-400", icon: <CheckCircle className="h-3 w-3" /> },
    ignored: { color: "bg-slate-500/20 text-slate-400" }
  };

  const config = configs[status];

  return (
    <Badge variant="outline" className={cn("gap-1", config.color)}>
      {config.icon}
      {status}
    </Badge>
  );
}

function StepIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    case "failed":
      return <X className="h-4 w-4 text-rose-400" />;
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-slate-600" />;
  }
}

function ChaosTypeIcon({ type }: { type: ChaosExperiment["type"] }) {
  const icons: Record<string, React.ReactNode> = {
    service_shutdown: <Power className="h-5 w-5 text-rose-400" />,
    latency_injection: <Timer className="h-5 w-5 text-amber-400" />,
    memory_pressure: <Activity className="h-5 w-5 text-purple-400" />,
    cpu_spike: <TrendingUp className="h-5 w-5 text-orange-400" />,
    network_partition: <Network className="h-5 w-5 text-cyan-400" />,
    disk_full: <Database className="h-5 w-5 text-slate-400" />
  };

  return (
    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
      {icons[type] ?? <Target className="h-5 w-5 text-slate-400" />}
    </div>
  );
}






