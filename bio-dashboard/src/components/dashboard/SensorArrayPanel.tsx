"use client";

import React, { useState, useCallback } from "react";
import { 
  Beaker, 
  Play, 
  RotateCcw, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BioRadarChart, 
  PatternMatchList 
} from "./BioRadarChart";
import {
  runPatternAnalysis,
  PatternAnalysisResult,
  getPatternById
} from "@/lib/pattern-recognition";
import { performanceMonitor } from "@/lib/performance";
import { useI18n } from "@/lib/i18n";

interface SensorArrayPanelProps {
  onAnalysisComplete?: (result: PatternAnalysisResult) => void;
}

type SimulationPattern = "random" | "healthy" | "kidney" | "diabetes" | "spoiled";

// Pattern options will be translated in the component using useI18n

/**
 * Sensor Array Panel
 * 
 * Part 3 Section 4: Electronic Nose/Tongue Interface
 * - 16채널 센서 어레이 시뮬레이션
 * - 패턴 인식 실행
 * - 결과 시각화
 */
export function SensorArrayPanel({ onAnalysisComplete }: SensorArrayPanelProps) {
  const { t } = useI18n();
  const [analysis, setAnalysis] = useState<PatternAnalysisResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<SimulationPattern>("random");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // Translated pattern options
  const PATTERN_OPTIONS: { value: SimulationPattern; label: string; emoji: string; description: string }[] = [
    { value: "random", label: t("pattern.random"), emoji: "🎲", description: t("pattern.randomDesc") },
    { value: "healthy", label: t("pattern.healthy"), emoji: "💚", description: t("pattern.healthyDesc") },
    { value: "kidney", label: t("pattern.kidney"), emoji: "🫘", description: t("pattern.kidneyDesc") },
    { value: "diabetes", label: t("pattern.diabetes"), emoji: "🍬", description: t("pattern.diabetesDesc") },
    { value: "spoiled", label: t("pattern.spoiled"), emoji: "🦠", description: t("pattern.spoiledDesc") }
  ];

  const runAnalysis = useCallback(async () => {
    setIsRunning(true);
    setAnalysisProgress(0);

    // 성능 측정 시작
    performanceMonitor.start("SENSOR_ARRAY_ANALYSIS");

    try {
      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 15, 90));
      }, 100);

      // 분석 실행 (약간의 딜레이로 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const result = runPatternAnalysis(selectedPattern);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      setAnalysis(result);
      onAnalysisComplete?.(result);

      // 성능 측정 완료
      performanceMonitor.end("SENSOR_ARRAY_ANALYSIS");

      console.log("[SensorArray] Analysis complete:", result);
    } catch (error) {
      console.error("[SensorArray] Analysis failed:", error);
      performanceMonitor.fail("SENSOR_ARRAY_ANALYSIS", error as Error);
    } finally {
      setIsRunning(false);
      // 진행률 초기화 (잠시 후)
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  }, [selectedPattern, onAnalysisComplete]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setAnalysisProgress(0);
  }, []);

  // 상태 아이콘
  const StatusIcon = () => {
    if (!analysis) return <Activity className="w-4 h-4 text-muted-foreground" />;
    switch (analysis.overallStatus) {
      case "normal":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Beaker className="w-4 h-4 text-primary" />
              {t("sensor.title")}
            </CardTitle>
            <CardDescription>
              {t("sensor.subtitle")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon />
            {analysis && (
              <Badge variant="outline" className="text-xs">
                {analysis.fingerprint.dimensions}{t("sensor.vector")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-3">
        {/* 패턴 선택 */}
        <div className="flex flex-wrap gap-1">
          {PATTERN_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={selectedPattern === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPattern(option.value)}
              disabled={isRunning}
              className="text-xs h-7"
              title={option.description}
            >
              {option.emoji} {option.label}
            </Button>
          ))}
        </div>

        {/* 진행률 */}
        {isRunning && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("sensor.arrayAnalyzing")}</span>
              <span className="font-mono">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-1.5" />
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button 
            onClick={runAnalysis} 
            disabled={isRunning}
            className="flex-1"
            size="sm"
          >
            {isRunning ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-pulse" />
                {t("sensor.analyzing")}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {t("sensor.runAnalysis")}
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={reset}
            disabled={isRunning || !analysis}
            size="sm"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* 결과 탭 */}
        <Tabs defaultValue="chart" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="chart" className="text-xs">{t("sensor.radarChart")}</TabsTrigger>
            <TabsTrigger value="matches" className="text-xs">{t("sensor.patternMatching")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="flex-1 mt-2">
            {analysis ? (
              <BioRadarChart analysis={analysis} compact />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <Beaker className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">{t("sensor.selectPattern")}</p>
                <p className="text-xs mt-1">{t("sensor.channelSimulation")}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="matches" className="flex-1 mt-2 overflow-auto">
            {analysis ? (
              <div className="space-y-3">
                <PatternMatchList matches={analysis.matches} />
                
                {/* 추천 사항 */}
                {analysis.topMatch && analysis.topMatch.isMatch && (
                  <div className="bg-muted/50 p-2 rounded-lg">
                    <div className="text-xs font-medium mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {t("sensor.recommendations")}
                    </div>
                    <div className="space-y-1">
                      {getPatternById(analysis.topMatch.patternId)?.recommendations.map((rec, i) => (
                        <div key={i} className="text-xs text-muted-foreground">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {t("sensor.noResults")}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 주요 반응 채널 */}
        {analysis && analysis.fingerprint.dominantChannels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">{t("sensor.mainReaction")}:</span>
            {analysis.fingerprint.dominantChannels.map(ch => (
              <Badge key={ch} variant="secondary" className="text-xs h-5">
                {ch}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SensorArrayPanel;



