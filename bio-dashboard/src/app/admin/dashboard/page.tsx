"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Box,
  Cpu,
  Database,
  Flame,
  Globe,
  Heart,
  MemoryStick,
  Package,
  Radio,
  Server,
  Thermometer,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  type GlobalMetrics,
  type RegionSignal,
  generateGlobalMetrics,
  generateUserActivityTimeSeries,
  generateMeasurementTimeSeries,
  generateErrorRateTimeSeries
} from "@/lib/admin-engine";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = React.useState<GlobalMetrics | null>(null);
  const [activityData, setActivityData] = React.useState<any[]>([]);
  const [measurementData, setMeasurementData] = React.useState<any[]>([]);
  const [errorData, setErrorData] = React.useState<any[]>([]);

  // Initial load + periodic refresh
  React.useEffect(() => {
    const load = () => {
      setMetrics(generateGlobalMetrics());
      setActivityData(generateUserActivityTimeSeries(24));
      setMeasurementData(generateMeasurementTimeSeries(24));
      setErrorData(generateErrorRateTimeSeries(24));
    };

    load();
    const interval = setInterval(load, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Global Observability Dashboard</h1>
        <p className="text-slate-400 text-sm">Real-time monitoring of the Manpasik ecosystem</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Users"
          value={metrics.activeUsers.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          trend={+5.2}
          color="cyan"
        />
        <StatCard
          title="Measurements Today"
          value={metrics.totalMeasurementsToday.toLocaleString()}
          icon={<Activity className="h-5 w-5" />}
          trend={+12.8}
          color="emerald"
        />
        <StatCard
          title="Avg Health Score"
          value={metrics.averageHealthScore.toString()}
          icon={<Heart className="h-5 w-5" />}
          trend={-1.2}
          color="rose"
        />
        <StatCard
          title="Critical Alerts"
          value={metrics.criticalAlerts.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={0}
          color={metrics.criticalAlerts > 0 ? "amber" : "slate"}
          alert={metrics.criticalAlerts > 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Activity Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-300">
                Active Users (24h)
              </CardTitle>
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                <Radio className="h-2 w-2 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="activeUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#06b6d4"
                    fill="url(#activeUsers)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Measurements Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Measurements per Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={measurementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Server Health + Region Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Server Health */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-300">
                Server Health
              </CardTitle>
              <Badge
                className={cn(
                  metrics.serverStatus.status === "healthy"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : metrics.serverStatus.status === "degraded"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-rose-500/20 text-rose-400"
                )}
              >
                {metrics.serverStatus.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ServerMetric
              label="CPU Usage"
              value={metrics.serverStatus.cpuUsage}
              icon={<Cpu className="h-4 w-4" />}
            />
            <ServerMetric
              label="Memory"
              value={metrics.serverStatus.memoryUsage}
              icon={<MemoryStick className="h-4 w-4" />}
            />
            <ServerMetric
              label="Disk"
              value={metrics.serverStatus.diskUsage}
              icon={<Database className="h-4 w-4" />}
            />
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <span className="text-slate-400">Error Rate</span>
              <span className={cn(
                "font-mono",
                metrics.serverStatus.errorRate > 2 ? "text-rose-400" : "text-slate-300"
              )}>
                {metrics.serverStatus.errorRate}‰
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">P95 Latency</span>
              <span className="font-mono text-slate-300">{metrics.serverStatus.latencyP95}ms</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Uptime</span>
              <span className="font-mono text-emerald-400">{metrics.serverStatus.uptime}h</span>
            </div>
          </CardContent>
        </Card>

        {/* Global Biosignal Heatmap */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-300">
                Global Biosignal Heatmap
              </CardTitle>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Normal
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Elevated
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-400" /> Critical
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {metrics.regionSignals.map((region) => (
                <RegionCard key={region.regionId} region={region} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Status */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-300">
              Cartridge Inventory (Global Warehouses)
            </CardTitle>
            <Package className="h-4 w-4 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 text-slate-400 font-medium">Warehouse</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Location</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Glucose</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Lactate</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Multi-Analyte</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Gas Sensor</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Hydrogel</th>
                </tr>
              </thead>
              <tbody>
                {metrics.cartridgeInventory.map((wh) => (
                  <tr key={wh.warehouseId} className="border-b border-slate-800/50">
                    <td className="py-2 font-medium">{wh.warehouseName}</td>
                    <td className="py-2 text-slate-400">{wh.location}</td>
                    {wh.cartridgeTypes.map((ct, idx) => (
                      <td key={idx} className="py-2 text-center">
                        <InventoryCell count={ct.count} status={ct.status} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Error Rate Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Error Rate (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={errorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
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
  trend,
  color,
  alert
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: number;
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
      alert && "border-amber-500/50 animate-pulse"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={colorClasses[color]}>{icon}</span>
          {trend !== 0 && (
            <div className={cn(
              "flex items-center gap-0.5 text-xs",
              trend > 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {trend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-slate-400 mt-1">{title}</div>
      </CardContent>
    </Card>
  );
}

function ServerMetric({
  label,
  value,
  icon
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          {icon}
          {label}
        </div>
        <span className={cn(
          "font-mono",
          value > 80 ? "text-rose-400" : value > 60 ? "text-amber-400" : "text-slate-300"
        )}>
          {value}%
        </span>
      </div>
      <Progress
        value={value}
        className={cn(
          "h-1.5",
          value > 80 ? "[&>div]:bg-rose-500" : value > 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-cyan-500"
        )}
      />
    </div>
  );
}

function RegionCard({ region }: { region: RegionSignal }) {
  const alertColors: Record<string, string> = {
    normal: "border-slate-700 bg-slate-800/50",
    elevated: "border-amber-700/50 bg-amber-900/20",
    warning: "border-orange-700/50 bg-orange-900/20",
    critical: "border-rose-700/50 bg-rose-900/20 animate-pulse"
  };

  return (
    <div className={cn(
      "rounded-lg border p-3 transition-all",
      alertColors[region.alertLevel]
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{region.regionName}</span>
        <div className={cn(
          "h-2 w-2 rounded-full",
          region.alertLevel === "normal" ? "bg-emerald-400" :
          region.alertLevel === "elevated" ? "bg-amber-400" :
          region.alertLevel === "warning" ? "bg-orange-400" : "bg-rose-400"
        )} />
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10px]">
        <div className="flex justify-between">
          <span className="text-slate-400">Flu</span>
          <span className={cn(
            region.signals.fluRisk > 50 ? "text-rose-400" : "text-slate-300"
          )}>{region.signals.fluRisk}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Gluc↑</span>
          <span className={cn(
            region.signals.glucoseHigh > 15 ? "text-amber-400" : "text-slate-300"
          )}>{region.signals.glucoseHigh}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Lact↑</span>
          <span>{region.signals.lactateHigh}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Radon</span>
          <span>{region.signals.radonAlert}%</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400">
        <Users className="h-3 w-3 inline mr-1" />
        {region.userCount.toLocaleString()} users
      </div>
    </div>
  );
}

function InventoryCell({ count, status }: { count: number; status: string }) {
  return (
    <span className={cn(
      "font-mono",
      status === "critical" ? "text-rose-400" :
      status === "low" ? "text-amber-400" : "text-slate-300"
    )}>
      {count.toLocaleString()}
    </span>
  );
}






