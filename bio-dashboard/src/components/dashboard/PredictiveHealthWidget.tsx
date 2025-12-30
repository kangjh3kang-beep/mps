"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Cloud,
  CloudLightning,
  CloudRain,
  Heart,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  type ImmunityForecast,
  type ChronicRiskAnalysis,
  type ChronicDiseaseRisk,
  predictImmunityForecast,
  predictChronicDiseaseRisk,
  generateMockImmunityData,
  generateMockChronicData
} from "@/lib/predictive-engine";
import { ScenarioSimulator } from "./ScenarioSimulator";

interface PredictiveHealthWidgetProps {
  className?: string;
  locale?: "ko" | "en";
  /** External immunity data (optional, uses mock if not provided) */
  immunityData?: Parameters<typeof predictImmunityForecast>[0];
  /** External chronic data (optional, uses mock if not provided) */
  chronicData?: Parameters<typeof predictChronicDiseaseRisk>[0];
  /** Callback when user wants to see more details */
  onViewDetails?: (type: "immunity" | "chronic") => void;
}

export function PredictiveHealthWidget({
  className,
  locale = "ko",
  immunityData,
  chronicData,
  onViewDetails
}: PredictiveHealthWidgetProps) {
  const isKo = locale === "ko";

  // Generate predictions (use provided data or mock)
  const immunityForecast = React.useMemo(() => {
    const data = immunityData ?? generateMockImmunityData();
    return predictImmunityForecast(data);
  }, [immunityData]);

  const chronicRisk = React.useMemo(() => {
    const data = chronicData ?? generateMockChronicData();
    return predictChronicDiseaseRisk(data);
  }, [chronicData]);

  return (
    <Card className={cn("border-2", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm">
              {isKo ? "예측 건강 엔진" : "Predictive Health Engine"}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {isKo ? "AI 기반" : "AI Powered"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {isKo
            ? "단기 면역력 예보 & 장기 만성질환 위험 분석"
            : "Short-term immunity forecast & Long-term chronic disease risk"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="immunity" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="immunity" className="text-xs">
              {isKo ? "면역력 예보" : "Immunity"}
            </TabsTrigger>
            <TabsTrigger value="chronic" className="text-xs">
              {isKo ? "만성질환" : "Chronic"}
            </TabsTrigger>
            <TabsTrigger value="whatif" className="text-xs">
              {isKo ? "시뮬레이터" : "What If"}
            </TabsTrigger>
          </TabsList>

          {/* Immunity Forecast Tab */}
          <TabsContent value="immunity" className="mt-3 space-y-3">
            <ImmunityForecastCard forecast={immunityForecast} isKo={isKo} />
          </TabsContent>

          {/* Chronic Disease Risk Tab */}
          <TabsContent value="chronic" className="mt-3 space-y-3">
            <ChronicRiskCard risk={chronicRisk} isKo={isKo} />
          </TabsContent>

          {/* What If Simulator Tab */}
          <TabsContent value="whatif" className="mt-3">
            <ScenarioSimulator chronicRisk={chronicRisk} locale={locale} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ============================================
 * Immunity Forecast Card
 * ============================================ */

function ImmunityForecastCard({
  forecast,
  isKo
}: {
  forecast: ImmunityForecast;
  isKo: boolean;
}) {
  const getWeatherIcon = () => {
    switch (forecast.riskLevel) {
      case "sunny":
        return <Sun className="h-8 w-8 text-amber-500" />;
      case "cloudy":
        return <Cloud className="h-8 w-8 text-slate-400" />;
      case "rainy":
        return <CloudRain className="h-8 w-8 text-sky-500" />;
      case "stormy":
        return <CloudLightning className="h-8 w-8 text-purple-500" />;
    }
  };

  const getWeatherLabel = () => {
    switch (forecast.riskLevel) {
      case "sunny":
        return isKo ? "☀️ 맑음 (양호)" : "☀️ Sunny (Good)";
      case "cloudy":
        return isKo ? "☁️ 흐림 (보통)" : "☁️ Cloudy (Moderate)";
      case "rainy":
        return isKo ? "🌧️ 비 (주의)" : "🌧️ Rainy (Warning)";
      case "stormy":
        return isKo ? "⛈️ 폭풍 (위험)" : "⛈️ Stormy (Danger)";
    }
  };

  const getRiskColor = () => {
    switch (forecast.riskLevel) {
      case "sunny":
        return "text-emerald-600";
      case "cloudy":
        return "text-amber-600";
      case "rainy":
        return "text-orange-600";
      case "stormy":
        return "text-rose-600";
    }
  };

  const getBgColor = () => {
    switch (forecast.riskLevel) {
      case "sunny":
        return "bg-gradient-to-br from-amber-50 to-emerald-50";
      case "cloudy":
        return "bg-gradient-to-br from-slate-50 to-amber-50";
      case "rainy":
        return "bg-gradient-to-br from-sky-50 to-slate-100";
      case "stormy":
        return "bg-gradient-to-br from-purple-50 to-rose-50";
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Forecast */}
      <div className={cn("rounded-xl p-4 text-center", getBgColor())}>
        <div className="flex items-center justify-center gap-3 mb-2">
          {getWeatherIcon()}
          <div>
            <div className={cn("text-lg font-bold", getRiskColor())}>
              {getWeatherLabel()}
            </div>
            <div className="text-xs text-muted-foreground">
              {isKo ? "면역력 예보" : "Immunity Forecast"}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Progress
            value={100 - forecast.riskScore}
            className="h-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{isKo ? "위험" : "Risk"}</span>
            <span>{isKo ? "안전" : "Safe"}</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-lg border bg-white p-3">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed">
            {isKo ? forecast.recommendationKo : forecast.recommendation}
          </p>
        </div>
      </div>

      {/* Contributing Factors */}
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-muted-foreground">
          {isKo ? "분석 요인" : "Contributing Factors"}
        </div>
        {forecast.factors.map((factor, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border bg-white px-2.5 py-1.5"
          >
            <span className="text-xs">{isKo ? factor.nameKo : factor.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono">
                {typeof factor.value === "number" ? factor.value.toFixed(1) : factor.value}
              </span>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  factor.status === "good"
                    ? "bg-emerald-500"
                    : factor.status === "warning"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                )}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Confidence */}
      <div className="text-center text-[10px] text-muted-foreground">
        {isKo ? "신뢰도" : "Confidence"}: {Math.round(forecast.confidence * 100)}%
      </div>
    </div>
  );
}

/* ============================================
 * Chronic Disease Risk Card
 * ============================================ */

function ChronicRiskCard({
  risk,
  isKo
}: {
  risk: ChronicRiskAnalysis;
  isKo: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Overall Risk Score */}
      <div className="rounded-xl bg-gradient-to-br from-rose-50 to-amber-50 p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">
          {isKo ? "전체 만성질환 위험도" : "Overall Chronic Disease Risk"}
        </div>
        <div className="flex items-center justify-center gap-2">
          <Heart
            className={cn(
              "h-6 w-6",
              risk.overallRiskScore >= 70
                ? "text-rose-500"
                : risk.overallRiskScore >= 45
                  ? "text-amber-500"
                  : "text-emerald-500"
            )}
          />
          <span
            className={cn(
              "text-3xl font-bold",
              risk.overallRiskScore >= 70
                ? "text-rose-600"
                : risk.overallRiskScore >= 45
                  ? "text-amber-600"
                  : "text-emerald-600"
            )}
          >
            {risk.overallRiskScore}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Primary Concern */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            {isKo ? risk.primaryConcernKo : risk.primaryConcern}
          </p>
        </div>
      </div>

      {/* Individual Disease Risks */}
      <div className="space-y-2">
        {risk.diabetesRisk && (
          <DiseaseRiskItem risk={risk.diabetesRisk} isKo={isKo} />
        )}
        {risk.hypertensionRisk && (
          <DiseaseRiskItem risk={risk.hypertensionRisk} isKo={isKo} />
        )}
      </div>
    </div>
  );
}

function DiseaseRiskItem({
  risk,
  isKo
}: {
  risk: ChronicDiseaseRisk;
  isKo: boolean;
}) {
  const getRiskBadge = () => {
    switch (risk.riskLevel) {
      case "critical":
        return <Badge variant="destructive" className="text-[10px]">Critical</Badge>;
      case "high":
        return <Badge className="text-[10px] bg-orange-500">High</Badge>;
      case "moderate":
        return <Badge className="text-[10px] bg-amber-500">Moderate</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">Low</Badge>;
    }
  };

  const getTrendIcon = () => {
    switch (risk.trend) {
      case "worsening":
        return <TrendingUp className="h-3 w-3 text-rose-500" />;
      case "improving":
        return <TrendingDown className="h-3 w-3 text-emerald-500" />;
      default:
        return <ArrowRight className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isKo ? risk.diseaseKo : risk.disease}
          </span>
          {getRiskBadge()}
        </div>
        <div className="flex items-center gap-1">
          {getTrendIcon()}
          <span className="text-[10px] text-muted-foreground">
            {risk.trend === "worsening"
              ? isKo
                ? "악화"
                : "Worsening"
              : risk.trend === "improving"
                ? isKo
                  ? "개선"
                  : "Improving"
                : isKo
                  ? "유지"
                  : "Stable"}
          </span>
        </div>
      </div>

      {/* Current vs Threshold */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">
            {isKo ? "현재" : "Current"}
          </div>
          <div className="text-sm font-mono font-bold">
            {risk.currentValue.toFixed(1)} {risk.unit}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">
            {isKo ? "기준치" : "Threshold"}
          </div>
          <div className="text-sm font-mono">
            {risk.thresholdValue} {risk.unit}
          </div>
        </div>
      </div>

      {/* Prediction */}
      {risk.monthsToThreshold && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-2 py-1.5 mb-2">
          <div className="text-xs text-rose-700">
            ⚠️{" "}
            {isKo
              ? `현재 추세라면 약 ${risk.monthsToThreshold}개월 후 기준치 도달 예상`
              : `At current trend, may reach threshold in ~${risk.monthsToThreshold} months`}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <p className="text-xs text-muted-foreground">
        {isKo ? risk.recommendationKo : risk.recommendation}
      </p>

      {/* Confidence */}
      <div className="mt-2 text-[10px] text-muted-foreground text-right">
        {isKo ? "신뢰도" : "Confidence"}: {Math.round(risk.confidence * 100)}%
      </div>
    </div>
  );
}

export default PredictiveHealthWidget;



