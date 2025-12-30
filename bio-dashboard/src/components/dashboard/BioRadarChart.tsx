"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Brain, Stethoscope } from "lucide-react";
import { 
  FingerprintVector, 
  STANDARD_SENSOR_ARRAY
} from "@/lib/sensor-array";
import { 
  PatternAnalysisResult,
  getHealthyReferenceVector,
  DiseasePattern,
  DISEASE_PATTERN_DB
} from "@/lib/pattern-recognition";
import { cn } from "@/lib/utils";

/* ============================================
 * Channel Interpretation Database
 * ============================================
 */
export interface ChannelInterpretation {
  channelId: string;
  channelName: string;
  biomarker: string;
  highInterpretation: string;
  lowInterpretation: string;
  diseaseAssociation: string[];
}

export const CHANNEL_INTERPRETATIONS: Record<string, ChannelInterpretation> = {
  "CH01": {
    channelId: "CH01",
    channelName: "Acetone Sensor",
    biomarker: "Acetone",
    highInterpretation: "Elevated acetone detected → Possible ketosis or diabetic ketoacidosis",
    lowInterpretation: "Normal acetone levels",
    diseaseAssociation: ["Diabetes", "Ketoacidosis", "Fasting state"]
  },
  "CH02": {
    channelId: "CH02",
    channelName: "Ammonia Sensor",
    biomarker: "Ammonia",
    highInterpretation: "Elevated ammonia detected → Kidney stress or liver dysfunction suspected",
    lowInterpretation: "Normal ammonia levels",
    diseaseAssociation: ["Kidney disease", "Liver cirrhosis", "Uremia"]
  },
  "CH03": {
    channelId: "CH03",
    channelName: "Ethanol Sensor",
    biomarker: "Ethanol",
    highInterpretation: "Ethanol presence detected → Recent alcohol consumption or fermentation",
    lowInterpretation: "No significant ethanol",
    diseaseAssociation: ["Alcohol intoxication", "Liver stress"]
  },
  "CH04": {
    channelId: "CH04",
    channelName: "Hydrogen Sulfide Sensor",
    biomarker: "H₂S",
    highInterpretation: "Elevated H₂S detected → Possible bacterial overgrowth or liver issue",
    lowInterpretation: "Normal H₂S levels",
    diseaseAssociation: ["Liver disease", "Gut dysbiosis", "Food spoilage"]
  },
  "CH05": {
    channelId: "CH05",
    channelName: "Methane Sensor",
    biomarker: "Methane",
    highInterpretation: "Elevated methane detected → Intestinal bacterial activity",
    lowInterpretation: "Normal methane levels",
    diseaseAssociation: ["SIBO", "Digestive issues"]
  },
  "CH06": {
    channelId: "CH06",
    channelName: "Nitrogen Dioxide Sensor",
    biomarker: "NO₂",
    highInterpretation: "Environmental NO₂ elevated → Air quality concern",
    lowInterpretation: "Normal NO₂ levels",
    diseaseAssociation: ["Respiratory stress", "Environmental pollution"]
  },
  "CH07": {
    channelId: "CH07",
    channelName: "VOC-A Sensor",
    biomarker: "VOC-A",
    highInterpretation: "Volatile organic compounds elevated → Metabolic imbalance suspected",
    lowInterpretation: "Normal VOC-A levels",
    diseaseAssociation: ["Liver disease", "Metabolic disorders"]
  },
  "CH08": {
    channelId: "CH08",
    channelName: "VOC-B Sensor",
    biomarker: "VOC-B",
    highInterpretation: "VOC-B elevated → Possible inflammation or oxidative stress",
    lowInterpretation: "Normal VOC-B levels",
    diseaseAssociation: ["Inflammation", "Oxidative stress"]
  },
  "CH09": {
    channelId: "CH09",
    channelName: "Lactate Sensor",
    biomarker: "Lactate",
    highInterpretation: "Elevated lactate detected → Muscle fatigue or anaerobic metabolism",
    lowInterpretation: "Normal lactate levels",
    diseaseAssociation: ["Exercise fatigue", "Lactic acidosis"]
  },
  "CH10": {
    channelId: "CH10",
    channelName: "Urea Sensor",
    biomarker: "Urea",
    highInterpretation: "Elevated urea detected → Kidney function concern",
    lowInterpretation: "Normal urea levels",
    diseaseAssociation: ["Kidney disease", "Dehydration"]
  },
  "CH11": {
    channelId: "CH11",
    channelName: "Glucose Sensor",
    biomarker: "Glucose",
    highInterpretation: "Elevated glucose detected → Blood sugar regulation issue",
    lowInterpretation: "Normal glucose levels",
    diseaseAssociation: ["Diabetes", "Insulin resistance"]
  },
  "CH12": {
    channelId: "CH12",
    channelName: "Cortisol Sensor",
    biomarker: "Cortisol",
    highInterpretation: "Elevated cortisol detected → Stress response activated",
    lowInterpretation: "Normal cortisol levels",
    diseaseAssociation: ["Chronic stress", "Adrenal issues"]
  }
};

/* ============================================
 * Interactive Tooltip Component
 * ============================================
 */
interface DeviationTooltipProps {
  channelId: string;
  currentValue: number;
  referenceValue: number;
  diseaseValue?: number;
  onClose: () => void;
  position: { x: number; y: number };
}

function DeviationTooltip({ 
  channelId, 
  currentValue, 
  referenceValue, 
  diseaseValue,
  onClose,
  position 
}: DeviationTooltipProps) {
  const interpretation = CHANNEL_INTERPRETATIONS[channelId];
  const deviation = currentValue - referenceValue;
  const deviationPercent = ((deviation / referenceValue) * 100).toFixed(1);
  const isElevated = deviation > 0.1;
  
  return (
    <div 
      className="fixed z-50 w-80 max-h-[70vh] bg-white/98 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-sky-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
      style={{ 
        left: Math.min(position.x, window.innerWidth - 340), 
        top: Math.min(position.y, window.innerHeight - 300) 
      }}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between flex-shrink-0",
        isElevated ? "bg-gradient-to-r from-rose-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
      )}>
        <div className="flex items-center gap-2 text-white">
          <Brain className="w-5 h-5" />
          <span className="font-semibold">AI 해석</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {/* Channel Info */}
        <div>
          <div className="text-sm font-medium text-foreground">
            {interpretation?.channelName || channelId}
          </div>
          <div className="text-xs text-muted-foreground">
            Biomarker: {interpretation?.biomarker || "Unknown"}
          </div>
        </div>
        
        {/* Values Comparison */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-emerald-50 rounded-lg p-2">
            <div className="text-[10px] text-emerald-600 font-medium">Healthy</div>
            <div className="text-lg font-bold text-emerald-700">{(referenceValue * 100).toFixed(0)}%</div>
          </div>
          <div className={cn(
            "rounded-lg p-2",
            isElevated ? "bg-rose-50" : "bg-sky-50"
          )}>
            <div className={cn(
              "text-[10px] font-medium",
              isElevated ? "text-rose-600" : "text-sky-600"
            )}>Current</div>
            <div className={cn(
              "text-lg font-bold",
              isElevated ? "text-rose-700" : "text-sky-700"
            )}>{(currentValue * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="text-[10px] text-slate-600 font-medium">Deviation</div>
            <div className={cn(
              "text-lg font-bold",
              isElevated ? "text-rose-600" : "text-emerald-600"
            )}>
              {isElevated ? "+" : ""}{deviationPercent}%
            </div>
          </div>
        </div>
        
        {/* AI Interpretation */}
        <div className={cn(
          "p-3 rounded-lg border-l-4",
          isElevated 
            ? "bg-rose-50 border-rose-500" 
            : "bg-emerald-50 border-emerald-500"
        )}>
          <div className="flex items-start gap-2">
            {isElevated ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Stethoscope className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-xs leading-relaxed">
              {isElevated 
                ? interpretation?.highInterpretation 
                : interpretation?.lowInterpretation}
            </p>
          </div>
        </div>
        
        {/* Disease Association */}
        {isElevated && interpretation?.diseaseAssociation && (
          <div className="flex flex-wrap gap-1">
            {interpretation.diseaseAssociation.map((disease, i) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">
                {disease}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
 * Enhanced Bio Radar Chart
 * ============================================
 */
interface BioRadarChartProps {
  analysis: PatternAnalysisResult | null;
  showReference?: boolean;
  showDiseasePattern?: boolean;
  diseasePatternId?: string;
  compact?: boolean;
  onAbnormalDetected?: (result: PatternAnalysisResult) => void;
}

interface ChartDataPoint {
  subject: string;
  channelId: string;
  current: number;
  reference: number;
  disease?: number;
  fullName: string;
}

/**
 * Enhanced Bio Radar Chart (Spider Chart)
 * 
 * Part 3 Section 4: Cross-reactive Sensor Array Visualization
 * - 12채널 센서 어레이 시각화
 * - 3가지 패턴 오버레이 (현재/정상/질병)
 * - 인터랙티브 AI 해석 툴팁
 */
export function BioRadarChart({ 
  analysis, 
  showReference = true,
  showDiseasePattern = true,
  diseasePatternId,
  compact = false,
  onAbnormalDetected
}: BioRadarChartProps) {
  const [activeTooltip, setActiveTooltip] = useState<{
    channelId: string;
    currentValue: number;
    referenceValue: number;
    diseaseValue?: number;
    position: { x: number; y: number };
  } | null>(null);

  // 12채널 이름 (축약형)
  const channelConfig = useMemo(() => {
    const channels = STANDARD_SENSOR_ARRAY.slice(0, 12);
    return channels.map((ch, i) => ({
      id: `CH${String(i + 1).padStart(2, '0')}`,
      name: ch.name,
      shortName: ch.id
    }));
  }, []);

  // 참조 패턴 (Healthy)
  const referenceVector = useMemo(() => {
    const healthy = getHealthyReferenceVector();
    return healthy.slice(0, 12);
  }, []);

  // 질병 패턴 (선택된 경우)
  const diseaseVector = useMemo(() => {
    if (!diseasePatternId) {
      // 분석 결과에서 top match가 질병 패턴인 경우 사용
      if (analysis?.topMatch && analysis.topMatch.patternId !== "healthy") {
        const pattern = DISEASE_PATTERN_DB.find(p => p.id === analysis.topMatch?.patternId);
        return pattern?.referenceVector.slice(0, 12);
      }
      return null;
    }
    const pattern = DISEASE_PATTERN_DB.find(p => p.id === diseasePatternId);
    return pattern?.referenceVector.slice(0, 12) || null;
  }, [diseasePatternId, analysis?.topMatch]);

  // 차트 데이터 변환 (12채널)
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!analysis) return [];
    
    return channelConfig.map((ch, i) => ({
      subject: ch.shortName,
      channelId: ch.id,
      fullName: ch.name,
      current: (analysis.fingerprint.values[i] || 0) * 100,
      reference: (referenceVector[i] || 0) * 100,
      disease: diseaseVector ? (diseaseVector[i] || 0) * 100 : undefined
    }));
  }, [analysis, referenceVector, diseaseVector, channelConfig]);

  // 클릭 핸들러
  const handleChartClick = useCallback((data: ChartDataPoint | null, event: React.MouseEvent) => {
    if (!data || !analysis) return;
    
    const channelIndex = channelConfig.findIndex(ch => ch.shortName === data.subject);
    if (channelIndex === -1) return;
    
    setActiveTooltip({
      channelId: `CH${String(channelIndex + 1).padStart(2, '0')}`,
      currentValue: analysis.fingerprint.values[channelIndex] || 0,
      referenceValue: referenceVector[channelIndex] || 0,
      diseaseValue: diseaseVector?.[channelIndex],
      position: { x: event.clientX + 10, y: event.clientY + 10 }
    });
  }, [analysis, channelConfig, referenceVector, diseaseVector]);

  // 비정상 패턴 감지 시 콜백 호출
  React.useEffect(() => {
    if (analysis && analysis.overallStatus !== "normal" && onAbnormalDetected) {
      // 80% 미만 유사도 = 비정상
      const healthyMatch = analysis.matches.find(m => m.patternId === "healthy");
      if (healthyMatch && healthyMatch.similarity < 0.80) {
        onAbnormalDetected(analysis);
      }
    }
  }, [analysis, onAbnormalDetected]);

  // 상태별 색상
  const statusColors = {
    normal: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
    warning: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
    alert: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" }
  };

  const statusLabels = {
    normal: "정상",
    warning: "주의",
    alert: "경고"
  };

  // Compact mode
  if (compact) {
    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: 8, fill: "#64748b" }}
            />
            {showReference && (
              <Radar
                name="Healthy"
                dataKey="reference"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.15}
                strokeWidth={1}
              />
            )}
            {showDiseasePattern && diseaseVector && (
              <Radar
                name="Disease"
                dataKey="disease"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.1}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
            <Radar
              name="Current"
              dataKey="current"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                🔬 12-Channel Sensor Analysis
              </CardTitle>
              <CardDescription>
                Click on deviation points for AI interpretation
              </CardDescription>
            </div>
            {analysis && (
              <Badge 
                className={`${statusColors[analysis.overallStatus].bg} ${statusColors[analysis.overallStatus].text}`}
              >
                {statusLabels[analysis.overallStatus]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!analysis ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              분석 데이터가 없습니다. 센서 어레이를 실행해주세요.
            </div>
          ) : (
            <>
              {/* 레이더 차트 */}
              <div className="h-72 cursor-crosshair">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    cx="50%" 
                    cy="50%" 
                    outerRadius="65%" 
                    data={chartData}
                    onClick={(e) => {
                      if (e?.activePayload?.[0]?.payload) {
                        handleChartClick(
                          e.activePayload[0].payload as ChartDataPoint,
                          e as unknown as React.MouseEvent
                        );
                      }
                    }}
                  >
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickLine={false}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fontSize: 8, fill: "#94a3b8" }}
                      tickCount={5}
                    />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          current: "🔵 현재 측정",
                          reference: "🟢 정상 참조",
                          disease: "🔴 질병 패턴"
                        };
                        return [`${value.toFixed(1)}%`, labels[name] || name];
                      }}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }}
                    />
                    
                    {/* Layer 1: Disease Pattern (Red, faint) */}
                    {showDiseasePattern && diseaseVector && (
                      <Radar
                        name="disease"
                        dataKey="disease"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.08}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                    )}
                    
                    {/* Layer 2: Healthy Reference (Green) */}
                    {showReference && (
                      <Radar
                        name="reference"
                        dataKey="reference"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.12}
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                      />
                    )}
                    
                    {/* Layer 3: Current Measurement (Blue) */}
                    <Radar
                      name="current"
                      dataKey="current"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.25}
                      strokeWidth={2}
                      dot={{ 
                        r: 4, 
                        fill: "#3b82f6",
                        stroke: "#fff",
                        strokeWidth: 1,
                        cursor: "pointer"
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#1d4ed8",
                        stroke: "#fff",
                        strokeWidth: 2,
                        cursor: "pointer"
                      }}
                    />
                    
                    <Legend 
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          current: "🔵 Current Pattern",
                          reference: "🟢 Healthy Reference",
                          disease: "🔴 Disease Pattern"
                        };
                        return <span className="text-xs">{labels[value] || value}</span>;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 분석 결과 */}
              <div className="space-y-2">
                {/* 알림 */}
                {analysis.alerts.length > 0 && (
                  <div className={`p-2 rounded-lg border ${statusColors[analysis.overallStatus].bg} ${statusColors[analysis.overallStatus].border}`}>
                    {analysis.alerts.map((alert, i) => (
                      <div key={i} className={`text-xs ${statusColors[analysis.overallStatus].text}`}>
                        {alert}
                      </div>
                    ))}
                  </div>
                )}

                {/* 상위 매칭 패턴 */}
                {analysis.topMatch && (
                  <div className="bg-muted/50 p-2 rounded-lg">
                    <div className="text-xs font-medium mb-1">🎯 Pattern Matching Result</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Top Match:</span>
                        <span className="ml-1 font-medium">{analysis.topMatch.patternNameKo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Similarity:</span>
                        <span className={`ml-1 font-medium ${
                          analysis.topMatch.similarity >= 0.85 
                            ? analysis.topMatch.patternId === "healthy" 
                              ? "text-emerald-600" 
                              : "text-rose-600"
                            : "text-amber-600"
                        }`}>
                          {(analysis.topMatch.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 인터랙션 힌트 */}
                <div className="text-center text-xs text-muted-foreground">
                  💡 Click on chart points to see AI interpretation
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Interactive Tooltip */}
      {activeTooltip && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setActiveTooltip(null)}
          />
          <DeviationTooltip
            channelId={activeTooltip.channelId}
            currentValue={activeTooltip.currentValue}
            referenceValue={activeTooltip.referenceValue}
            diseaseValue={activeTooltip.diseaseValue}
            position={activeTooltip.position}
            onClose={() => setActiveTooltip(null)}
          />
        </>
      )}
    </>
  );
}

/**
 * 패턴 매칭 결과 목록 컴포넌트
 */
export function PatternMatchList({ 
  matches 
}: { 
  matches: PatternAnalysisResult["matches"] 
}) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="space-y-1">
      {matches.slice(0, 5).map((match, i) => (
        <div 
          key={match.patternId}
          className={`flex items-center justify-between p-2 rounded text-xs ${
            match.isMatch 
              ? match.patternId === "healthy"
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-rose-50 border border-rose-200"
              : "bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">#{i + 1}</span>
            <span className="font-medium">{match.patternNameKo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-mono ${
              match.similarity >= 0.85 
                ? match.patternId === "healthy" ? "text-emerald-600" : "text-rose-600"
                : "text-muted-foreground"
            }`}>
              {(match.similarity * 100).toFixed(1)}%
            </span>
            {match.isMatch && (
              <Badge variant="outline" className="text-xs h-5">
                Match
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default BioRadarChart;
