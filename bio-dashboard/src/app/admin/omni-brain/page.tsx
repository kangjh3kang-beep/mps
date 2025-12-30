"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  ChevronRight,
  Clock,
  Database,
  Dna,
  Eye,
  GitBranch,
  Heart,
  Layers,
  Loader2,
  Network,
  Play,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ============================================
 * Mock Data
 * ============================================ */

const BRAIN_STATS = {
  totalDataPoints: 12847563,
  knowledgeNodes: 45678,
  knowledgeEdges: 234567,
  activeModels: 3,
  currentGeneration: 24,
  lastEvolution: "2025-01-25T03:00:00Z",
  nextEvolution: "2025-02-01T03:00:00Z",
  predictionAccuracy: 94.2,
  healthImpact: {
    avgScoreImprovement: 6.8,
    usersHelped: 12453,
    successfulInterventions: 8934
  }
};

const DATA_STREAMS = [
  {
    id: "bio_signal",
    name: "Bio-Signal DNA",
    nameKo: "바이오 신호 DNA",
    icon: Dna,
    color: "emerald",
    ingestRate: "1,247/min",
    totalRecords: "8.4M",
    quality: 94,
    lastIngested: "2 seconds ago"
  },
  {
    id: "behavioral",
    name: "Behavioral DNA",
    nameKo: "행동 DNA",
    icon: Activity,
    color: "cyan",
    ingestRate: "3,891/min",
    totalRecords: "24.1M",
    quality: 87,
    lastIngested: "1 second ago"
  },
  {
    id: "medical",
    name: "Medical DNA",
    nameKo: "의료 DNA",
    icon: Heart,
    color: "rose",
    ingestRate: "42/min",
    totalRecords: "156K",
    quality: 99,
    lastIngested: "15 seconds ago"
  },
  {
    id: "commerce",
    name: "Commerce DNA",
    nameKo: "커머스 DNA",
    icon: Target,
    color: "amber",
    ingestRate: "567/min",
    totalRecords: "2.1M",
    quality: 91,
    lastIngested: "3 seconds ago"
  }
];

const MODEL_GENERATIONS = [
  { gen: 24, version: "v2025.01.25", accuracy: 94.2, status: "deployed", improvement: "+2.1%" },
  { gen: 23, version: "v2025.01.18", accuracy: 92.1, status: "retired", improvement: "+1.8%" },
  { gen: 22, version: "v2025.01.11", accuracy: 90.3, status: "retired", improvement: "+0.9%" },
  { gen: 21, version: "v2025.01.04", accuracy: 89.4, status: "retired", improvement: "+1.2%" }
];

const KNOWLEDGE_DISCOVERIES = [
  {
    id: "disc_001",
    pattern: "Users taking Omega-3 + Exercise",
    outcome: "47% faster inflammation reduction",
    correlation: 0.89,
    sampleSize: 1247,
    status: "approved"
  },
  {
    id: "disc_002",
    pattern: "Morning measurements + Coffee",
    outcome: "12% higher glucose variance",
    correlation: 0.76,
    sampleSize: 3421,
    status: "approved"
  },
  {
    id: "disc_003",
    pattern: "Magnesium before sleep",
    outcome: "23% improved lactate clearance next day",
    correlation: 0.82,
    sampleSize: 892,
    status: "pending"
  }
];

export default function OmniBrainPage() {
  const [isEvolving, setIsEvolving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleForceEvolution = async () => {
    setIsEvolving(true);
    await new Promise(r => setTimeout(r, 5000));
    setIsEvolving(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-400" />
            Manpasik Omni Brain
          </h1>
          <p className="text-slate-400 text-sm">Self-Evolving AI Entity - Endogenous Learning Only</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-purple-500/50 text-purple-400 animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            Generation {BRAIN_STATS.currentGeneration}
          </Badge>
          <Button
            onClick={handleForceEvolution}
            disabled={isEvolving}
            variant="outline"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
          >
            {isEvolving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Evolving...</>
            ) : (
              <><GitBranch className="h-4 w-4 mr-2" /> Force Evolution</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Data Points"
          value={BRAIN_STATS.totalDataPoints.toLocaleString()}
          icon={<Database className="h-5 w-5" />}
          color="purple"
          subtext="Internal ecosystem only"
        />
        <StatCard
          title="Knowledge Nodes"
          value={BRAIN_STATS.knowledgeNodes.toLocaleString()}
          icon={<Network className="h-5 w-5" />}
          color="cyan"
          subtext={`${BRAIN_STATS.knowledgeEdges.toLocaleString()} edges`}
        />
        <StatCard
          title="Prediction Accuracy"
          value={`${BRAIN_STATS.predictionAccuracy}%`}
          icon={<Target className="h-5 w-5" />}
          color="emerald"
          subtext="7-day health forecast"
        />
        <StatCard
          title="Users Helped"
          value={BRAIN_STATS.healthImpact.usersHelped.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          color="amber"
          subtext={`+${BRAIN_STATS.healthImpact.avgScoreImprovement} avg score`}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="nervous-system" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="nervous-system" className="data-[state=active]:bg-slate-700">
            Nervous System
          </TabsTrigger>
          <TabsTrigger value="cognitive-core" className="data-[state=active]:bg-slate-700">
            Cognitive Core
          </TabsTrigger>
          <TabsTrigger value="knowledge-graph" className="data-[state=active]:bg-slate-700">
            Knowledge Graph
          </TabsTrigger>
          <TabsTrigger value="evolution" className="data-[state=active]:bg-slate-700">
            Evolution
          </TabsTrigger>
        </TabsList>

        {/* Nervous System Tab */}
        <TabsContent value="nervous-system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Data Ingestion Streams */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-purple-400" />
                  Data DNA Streams
                </CardTitle>
                <CardDescription>
                  Real-time data ingestion from internal ecosystem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {DATA_STREAMS.map(stream => (
                  <div
                    key={stream.id}
                    className="rounded-lg border border-slate-700 p-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          stream.color === "emerald" && "bg-emerald-500/20",
                          stream.color === "cyan" && "bg-cyan-500/20",
                          stream.color === "rose" && "bg-rose-500/20",
                          stream.color === "amber" && "bg-amber-500/20"
                        )}>
                          <stream.icon className={cn(
                            "h-4 w-4",
                            stream.color === "emerald" && "text-emerald-400",
                            stream.color === "cyan" && "text-cyan-400",
                            stream.color === "rose" && "text-rose-400",
                            stream.color === "amber" && "text-amber-400"
                          )} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{stream.name}</div>
                          <div className="text-[10px] text-slate-500">{stream.nameKo}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        {stream.ingestRate}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">Records</div>
                        <div className="font-mono">{stream.totalRecords}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Quality</div>
                        <div className="flex items-center gap-1">
                          <Progress value={stream.quality} className="h-1.5 w-12" />
                          <span>{stream.quality}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Last</div>
                        <div className="text-emerald-400">{stream.lastIngested}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Signal Quality Gate */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Hippocampus Gate (Signal Quality Filter)
                </CardTitle>
                <CardDescription>
                  Only high-purity signals enter long-term memory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Quality Threshold */}
                  <div className="text-center py-8">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-slate-800"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={`${80 * 3.52} 352`}
                          className="text-emerald-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">80+</span>
                        <span className="text-xs text-slate-400">SQI Threshold</span>
                      </div>
                    </div>
                  </div>

                  {/* Gate Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg bg-slate-800/50 p-3">
                      <div className="text-xl font-bold text-emerald-400">78%</div>
                      <div className="text-[10px] text-slate-400">Pass Rate</div>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-3">
                      <div className="text-xl font-bold text-amber-400">12%</div>
                      <div className="text-[10px] text-slate-400">Filtered</div>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-3">
                      <div className="text-xl font-bold text-rose-400">10%</div>
                      <div className="text-[10px] text-slate-400">Noise</div>
                    </div>
                  </div>

                  {/* Quality Metrics */}
                  <div className="space-y-2">
                    {[
                      { label: "SNR Check", passed: true },
                      { label: "Baseline Drift", passed: true },
                      { label: "Noise Level", passed: true },
                      { label: "Calibration Valid", passed: true }
                    ].map((check, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{check.label}</span>
                        <Badge className={check.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}>
                          {check.passed ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cognitive Core Tab */}
        <TabsContent value="cognitive-core" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* TimeNet Model */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-purple-400" />
                  Manpasik TimeNet
                </CardTitle>
                <CardDescription>
                  Transformer + LSTM Prediction Engine
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 text-center">
                  <div className="text-3xl font-bold mb-1">94.2%</div>
                  <div className="text-xs text-slate-400">Prediction Accuracy</div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Input Dimensions</span>
                    <span className="font-mono">88 + 32 + 64</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transformer Layers</span>
                    <span className="font-mono">6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">LSTM Layers</span>
                    <span className="font-mono">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prediction Horizon</span>
                    <span className="font-mono">7 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parameters</span>
                    <span className="font-mono">12.4M</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* The Mirror */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  The Mirror
                </CardTitle>
                <CardDescription>
                  Digital Twin Simulator
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-4 text-center">
                  <div className="text-3xl font-bold mb-1">2,847</div>
                  <div className="text-xs text-slate-400">Simulations Today</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-400 mb-2">Top "What If" Questions</div>
                  {[
                    "If I start Vitamin D?",
                    "If I exercise 30min/day?",
                    "If I reduce sugar intake?"
                  ].map((q, idx) => (
                    <div key={idx} className="rounded bg-slate-800/50 px-3 py-2 text-xs">
                      {q}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* The Guardian */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-rose-400" />
                  The Guardian
                </CardTitle>
                <CardDescription>
                  Anomaly Detection System
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-gradient-to-br from-rose-500/20 to-orange-500/20 p-4 text-center">
                  <div className="text-3xl font-bold mb-1">0</div>
                  <div className="text-xs text-slate-400">Active Anomalies</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-400 mb-2">Recent Checks</div>
                  {[
                    { name: "Cartridge Batch Quality", status: "OK" },
                    { name: "User Health Patterns", status: "OK" },
                    { name: "Data Integrity", status: "OK" }
                  ].map((check, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span>{check.name}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400">
                        {check.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Knowledge Graph Tab */}
        <TabsContent value="knowledge-graph" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Network className="h-4 w-4 text-cyan-400" />
                    Manpasik Knowledge Graph
                  </CardTitle>
                  <CardDescription>
                    Living Encyclopedia of the Ecosystem
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search graph..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Graph Visualization Placeholder */}
              <div className="rounded-xl bg-slate-950 h-64 flex items-center justify-center mb-6">
                <div className="text-center">
                  <Network className="h-12 w-12 text-cyan-400/30 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">{BRAIN_STATS.knowledgeNodes.toLocaleString()} Nodes</p>
                  <p className="text-slate-500 text-xs">{BRAIN_STATS.knowledgeEdges.toLocaleString()} Edges</p>
                </div>
              </div>

              {/* Auto-Discovered Correlations */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Auto-Discovered Correlations
                </h3>
                <div className="space-y-2">
                  {KNOWLEDGE_DISCOVERIES.map(disc => (
                    <div
                      key={disc.id}
                      className={cn(
                        "rounded-lg border p-4",
                        disc.status === "approved"
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-amber-500/30 bg-amber-500/5"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{disc.pattern}</span>
                            <ArrowRight className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-300">{disc.outcome}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Correlation: {(disc.correlation * 100).toFixed(0)}%</span>
                            <span>Sample: {disc.sampleSize}</span>
                          </div>
                        </div>
                        <Badge className={
                          disc.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }>
                          {disc.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Model Generations */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <GitBranch className="h-4 w-4 text-purple-400" />
                  Model Generations
                </CardTitle>
                <CardDescription>
                  Survival of the Fittest Strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MODEL_GENERATIONS.map((gen, idx) => (
                    <div
                      key={gen.gen}
                      className={cn(
                        "rounded-lg border p-4",
                        idx === 0
                          ? "border-purple-500/30 bg-purple-500/5"
                          : "border-slate-700 bg-slate-800/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Gen {gen.gen}</span>
                          <code className="text-xs text-slate-400">{gen.version}</code>
                        </div>
                        <Badge className={
                          gen.status === "deployed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-500/20 text-slate-400"
                        }>
                          {gen.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="text-slate-400">Accuracy:</span>
                          <span className="font-mono">{gen.accuracy}%</span>
                        </div>
                        <span className="text-emerald-400">{gen.improvement}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Evolution Schedule */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-400" />
                  Evolution Schedule
                </CardTitle>
                <CardDescription>
                  Autopoiesis - Self-Optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Next Evolution Countdown */}
                <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 text-center">
                  <div className="text-sm text-slate-400 mb-2">Next Evolution In</div>
                  <div className="text-3xl font-bold mb-1">6 days 14 hours</div>
                  <div className="text-xs text-slate-500">
                    {new Date(BRAIN_STATS.nextEvolution).toLocaleString()}
                  </div>
                </div>

                {/* Evolution Process */}
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-3">Evolution Process</h4>
                  <div className="space-y-2">
                    {[
                      { step: "Collect successful interventions", status: "ongoing" },
                      { step: "Train challenger model", status: "pending" },
                      { step: "A/B test (5% traffic)", status: "pending" },
                      { step: "Evaluate & promote", status: "pending" }
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                          step.status === "ongoing"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-slate-800 text-slate-500"
                        )}>
                          {idx + 1}
                        </div>
                        <span className={cn(
                          "text-sm",
                          step.status === "ongoing" ? "text-slate-200" : "text-slate-500"
                        )}>
                          {step.step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RL Stats */}
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-3">Reinforcement Learning</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                      <div className="text-lg font-bold text-emerald-400">
                        {BRAIN_STATS.healthImpact.successfulInterventions.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">Successful Interventions</div>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                      <div className="text-lg font-bold text-cyan-400">71.6%</div>
                      <div className="text-[10px] text-slate-400">Success Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
  subtext
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: "text-purple-400",
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400"
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={colorClasses[color]}>{icon}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-slate-400 mt-1">{title}</div>
        {subtext && (
          <div className="text-[10px] text-slate-500 mt-0.5">{subtext}</div>
        )}
      </CardContent>
    </Card>
  );
}






