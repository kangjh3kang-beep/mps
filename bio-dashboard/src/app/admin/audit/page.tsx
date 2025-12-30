"use client";

import * as React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  Flag,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserX,
  X,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  type AuditAnomaly,
  type AccessPattern,
  generateAnomalies,
  generateAccessPatterns
} from "@/lib/admin-engine";

export default function AdminAuditPage() {
  const [anomalies, setAnomalies] = React.useState<AuditAnomaly[]>([]);
  const [accessPatterns, setAccessPatterns] = React.useState<AccessPattern[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = React.useState<AuditAnomaly | null>(null);
  const [resolveModal, setResolveModal] = React.useState<AuditAnomaly | null>(null);
  const [resolving, setResolving] = React.useState(false);
  const [severityFilter, setSeverityFilter] = React.useState<string>("all");

  React.useEffect(() => {
    setAnomalies(generateAnomalies());
    setAccessPatterns(generateAccessPatterns());
  }, []);

  const handleResolve = async (anomaly: AuditAnomaly) => {
    setResolving(true);
    await new Promise(r => setTimeout(r, 1500));
    
    setAnomalies(prev => prev.map(a => 
      a.id === anomaly.id
        ? { ...a, resolved: true, resolvedBy: "admin_001", resolvedAt: new Date().toISOString() }
        : a
    ));
    
    setResolving(false);
    setResolveModal(null);
  };

  const unresolvedCount = anomalies.filter(a => !a.resolved).length;
  const criticalCount = anomalies.filter(a => !a.resolved && a.severity === "critical").length;

  const filteredAnomalies = anomalies.filter(a => {
    if (severityFilter === "all") return true;
    if (severityFilter === "unresolved") return !a.resolved;
    return a.severity === severityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medical & Security Audit</h1>
          <p className="text-slate-400 text-sm">FDA Part 11 Compliance & Anomaly Detection</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {criticalCount > 0 && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-6 w-6 text-rose-400" />
            <div>
              <div className="font-medium text-rose-300">
                {criticalCount} Critical Security Alert{criticalCount > 1 ? "s" : ""}
              </div>
              <div className="text-sm text-rose-400/80">
                Immediate attention required. Review and resolve these issues.
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-rose-500/50 text-rose-400 hover:bg-rose-500/20"
            onClick={() => setSeverityFilter("critical")}
          >
            View Critical
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Anomalies"
          value={anomalies.length}
          icon={<ShieldAlert className="h-5 w-5" />}
          color="slate"
        />
        <StatCard
          title="Unresolved"
          value={unresolvedCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="amber"
          alert={unresolvedCount > 0}
        />
        <StatCard
          title="Critical"
          value={criticalCount}
          icon={<AlertOctagon className="h-5 w-5" />}
          color="rose"
          alert={criticalCount > 0}
        />
        <StatCard
          title="Resolved Today"
          value={anomalies.filter(a => a.resolved).length}
          icon={<ShieldCheck className="h-5 w-5" />}
          color="emerald"
        />
      </div>

      <Tabs defaultValue="anomalies" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="anomalies" className="data-[state=active]:bg-slate-700">
            Anomalies
            {unresolvedCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                {unresolvedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="access" className="data-[state=active]:bg-slate-700">
            Access Patterns
          </TabsTrigger>
          <TabsTrigger value="part11" className="data-[state=active]:bg-slate-700">
            Part 11 Logs
          </TabsTrigger>
        </TabsList>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          {/* Filters */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {["all", "unresolved", "critical", "high", "medium", "low"].map(filter => (
                  <Button
                    key={filter}
                    variant={severityFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSeverityFilter(filter)}
                    className={cn(
                      severityFilter === filter
                        ? "bg-cyan-600"
                        : "border-slate-700 text-slate-400"
                    )}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Anomaly List */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800">
                {filteredAnomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={cn(
                      "p-4 hover:bg-slate-800/30 transition-colors",
                      !anomaly.resolved && anomaly.severity === "critical" && "bg-rose-500/5"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <SeverityIcon severity={anomaly.severity} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{anomaly.description}</span>
                            <SeverityBadge severity={anomaly.severity} />
                            {anomaly.resolved && (
                              <Badge className="bg-emerald-500/20 text-emerald-400">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {anomaly.userName} ({anomaly.userId})
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(anomaly.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Flag className="h-3 w-3" />
                              {anomaly.type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAnomaly(
                            selectedAnomaly?.id === anomaly.id ? null : anomaly
                          )}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                          {selectedAnomaly?.id === anomaly.id ? (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronRight className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                        {!anomaly.resolved && (
                          <Button
                            size="sm"
                            onClick={() => setResolveModal(anomaly)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedAnomaly?.id === anomaly.id && (
                      <div className="mt-4 ml-12 p-4 rounded-lg bg-slate-800/50 text-sm">
                        <div className="font-medium mb-2 text-slate-300">Details</div>
                        <pre className="text-xs font-mono text-slate-400 overflow-x-auto">
                          {JSON.stringify(anomaly.details, null, 2)}
                        </pre>
                        {anomaly.resolved && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <div className="text-xs text-slate-400">
                              Resolved by <span className="text-emerald-400">{anomaly.resolvedBy}</span>{" "}
                              at {new Date(anomaly.resolvedAt!).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Patterns Tab */}
        <TabsContent value="access" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Real-time Access Monitoring</CardTitle>
              <CardDescription>
                Detecting unusual access patterns across all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left p-3 text-slate-400 font-medium">User</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Role</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Access Count</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Time Window</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Record Types</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessPatterns.map((pattern, idx) => (
                      <tr
                        key={idx}
                        className={cn(
                          "border-b border-slate-800/50",
                          pattern.isAnomalous && "bg-amber-500/5"
                        )}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                              <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                              <div className="font-medium">{pattern.userName}</div>
                              <div className="text-xs text-slate-400">{pattern.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="border-slate-600">
                            {pattern.role}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "font-mono",
                            pattern.isAnomalous ? "text-amber-400" : "text-slate-300"
                          )}>
                            {pattern.accessCount}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{pattern.timeWindow}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {pattern.recordTypes.map((type, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          {pattern.isAnomalous ? (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-amber-500/20 text-amber-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Anomalous
                              </Badge>
                            </div>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Normal
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Part 11 Logs Tab */}
        <TabsContent value="part11" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-cyan-400" />
                    FDA 21 CFR Part 11 Audit Trail
                  </CardTitle>
                  <CardDescription>
                    Complete immutable record of all system activities
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-700"
                  onClick={() => window.location.href = "/audit"}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Full Audit View
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-slate-800/50 p-6 text-center">
                <Database className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <div className="text-lg font-medium mb-2">Audit Trail Active</div>
                <div className="text-sm text-slate-400 mb-4">
                  All system actions are being recorded with cryptographic integrity verification.
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    Chain Verified
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Lock className="h-4 w-4" />
                    Tamper-Proof
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Zap className="h-4 w-4" />
                    Real-time Sync
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Modal */}
      <Dialog open={!!resolveModal} onOpenChange={() => setResolveModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Resolve Anomaly
            </DialogTitle>
            <DialogDescription>
              Mark this anomaly as resolved: "{resolveModal?.description}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm text-slate-400 mb-2">Resolution Notes (optional)</div>
            <Input
              placeholder="Add notes about how this was resolved..."
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveModal(null)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => resolveModal && handleResolve(resolveModal)}
              disabled={resolving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {resolving ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Resolving...</>
              ) : (
                <>Mark Resolved</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  alert
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  alert?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
    slate: "text-slate-400"
  };

  return (
    <Card className={cn(
      "bg-slate-900 border-slate-800",
      alert && "border-amber-500/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={colorClasses[color]}>{icon}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-slate-400 mt-1">{title}</div>
      </CardContent>
    </Card>
  );
}

function SeverityIcon({ severity }: { severity: AuditAnomaly["severity"] }) {
  const configs: Record<string, { color: string; icon: React.ReactNode }> = {
    critical: { color: "bg-rose-500/20", icon: <AlertOctagon className="h-5 w-5 text-rose-400" /> },
    high: { color: "bg-orange-500/20", icon: <AlertTriangle className="h-5 w-5 text-orange-400" /> },
    medium: { color: "bg-amber-500/20", icon: <AlertTriangle className="h-5 w-5 text-amber-400" /> },
    low: { color: "bg-slate-500/20", icon: <ShieldAlert className="h-5 w-5 text-slate-400" /> }
  };
  
  const config = configs[severity];
  
  return (
    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", config.color)}>
      {config.icon}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: AuditAnomaly["severity"] }) {
  const configs: Record<string, string> = {
    critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-slate-500/20 text-slate-400 border-slate-500/30"
  };
  
  return (
    <Badge variant="outline" className={configs[severity]}>
      {severity}
    </Badge>
  );
}






