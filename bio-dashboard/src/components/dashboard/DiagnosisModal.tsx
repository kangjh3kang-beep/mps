"use client";

import React from "react";
import {
  AlertTriangle,
  X,
  Stethoscope,
  Utensils,
  Bed,
  ChevronRight,
  Brain,
  Activity,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PatternAnalysisResult, 
  getPatternById,
  DiseasePattern
} from "@/lib/pattern-recognition";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface DiagnosisModalProps {
  analysis: PatternAnalysisResult;
  isOpen: boolean;
  onClose: () => void;
  onBookDoctor: () => void;
}

/**
 * Diagnosis-to-Action Modal
 * 
 * Triggered when Non-Target analysis flags an abnormal pattern (similarity < 80%)
 * Explains the graph and suggests next steps
 */
export function DiagnosisModal({
  analysis,
  isOpen,
  onClose,
  onBookDoctor
}: DiagnosisModalProps) {
  const { t, locale } = useI18n();

  if (!isOpen) return null;

  const topMatch = analysis.topMatch;
  const healthyMatch = analysis.matches.find(m => m.patternId === "healthy");
  const healthySimilarity = healthyMatch?.similarity || 0;
  const isAbnormal = healthySimilarity < 0.80;

  // Get disease pattern details
  const diseasePattern = topMatch && topMatch.patternId !== "healthy" 
    ? getPatternById(topMatch.patternId) 
    : null;

  // Generate recommendations based on pattern
  const getRecommendations = () => {
    const recommendations: { icon: React.ReactNode; text: string; action?: string; priority: "high" | "medium" | "low" }[] = [];
    
    if (diseasePattern) {
      // Disease-specific recommendations
      if (diseasePattern.id === "kidney_disease") {
        recommendations.push({
          icon: <Stethoscope className="w-5 h-5" />,
          text: locale === "ko" 
            ? "신장 기능 검사를 권장합니다" 
            : "Kidney function test is recommended",
          action: "book",
          priority: "high"
        });
        recommendations.push({
          icon: <Utensils className="w-5 h-5" />,
          text: locale === "ko"
            ? "저단백 식단으로 전환하세요"
            : "Switch to a low-protein diet",
          priority: "medium"
        });
      } else if (diseasePattern.id === "diabetes_ketoacidosis") {
        recommendations.push({
          icon: <Stethoscope className="w-5 h-5" />,
          text: locale === "ko"
            ? "혈당 검사를 즉시 받으세요"
            : "Get blood sugar test immediately",
          action: "book",
          priority: "high"
        });
        recommendations.push({
          icon: <Utensils className="w-5 h-5" />,
          text: locale === "ko"
            ? "탄수화물 섭취를 줄이세요"
            : "Reduce carbohydrate intake",
          priority: "medium"
        });
      } else if (diseasePattern.id === "liver_disease") {
        recommendations.push({
          icon: <Stethoscope className="w-5 h-5" />,
          text: locale === "ko"
            ? "간 기능 검사를 권장합니다"
            : "Liver function test is recommended",
          action: "book",
          priority: "high"
        });
        recommendations.push({
          icon: <Utensils className="w-5 h-5" />,
          text: locale === "ko"
            ? "알코올 섭취를 피하세요"
            : "Avoid alcohol consumption",
          priority: "medium"
        });
      } else if (diseasePattern.id === "spoiled_food") {
        recommendations.push({
          icon: <AlertTriangle className="w-5 h-5" />,
          text: locale === "ko"
            ? "해당 식품 섭취를 중단하세요"
            : "Stop consuming this food",
          priority: "high"
        });
      }
    }
    
    // General recommendations for abnormal patterns
    if (isAbnormal && recommendations.length === 0) {
      recommendations.push({
        icon: <Stethoscope className="w-5 h-5" />,
        text: t("diagnosis.consultDoctor"),
        action: "book",
        priority: "high"
      });
      recommendations.push({
        icon: <Bed className="w-5 h-5" />,
        text: t("diagnosis.restRecommended"),
        priority: "medium"
      });
      recommendations.push({
        icon: <Utensils className="w-5 h-5" />,
        text: t("diagnosis.dietChange"),
        priority: "low"
      });
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
        <Card className="border-2 border-rose-200 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{t("diagnosis.title")}</h2>
                  <p className="text-sm text-white/80">{t("diagnosis.abnormalDetected")}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            {/* Pattern Analysis Summary */}
            <div className="grid grid-cols-2 gap-3">
              {/* Healthy Similarity */}
              <div className={cn(
                "rounded-xl p-3 text-center",
                healthySimilarity >= 0.80 ? "bg-emerald-50" : "bg-rose-50"
              )}>
                <div className="text-xs text-muted-foreground mb-1">
                  {locale === "ko" ? "정상 패턴 유사도" : "Healthy Pattern"}
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  healthySimilarity >= 0.80 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {(healthySimilarity * 100).toFixed(0)}%
                </div>
                {healthySimilarity < 0.80 && (
                  <div className="text-xs text-rose-600 mt-1">
                    {locale === "ko" ? "⚠️ 80% 미만" : "⚠️ Below 80%"}
                  </div>
                )}
              </div>

              {/* Top Match */}
              {topMatch && topMatch.patternId !== "healthy" && (
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {locale === "ko" ? "의심 패턴" : "Suspected Pattern"}
                  </div>
                  <div className="text-sm font-bold text-amber-700">
                    {topMatch.patternNameKo}
                  </div>
                  <div className="text-lg font-bold text-amber-600">
                    {(topMatch.similarity * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>

            {/* AI Explanation */}
            {diseasePattern && (
              <div className="bg-slate-50 rounded-xl p-3 border-l-4 border-amber-500">
                <div className="flex items-start gap-2">
                  <Activity className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium mb-1">
                      {locale === "ko" ? "AI 분석" : "AI Analysis"}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {diseasePattern.description}
                    </p>
                    {diseasePattern.markers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {diseasePattern.markers.map((marker, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-[10px] bg-amber-100 text-amber-700 border-amber-200"
                          >
                            {marker}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                {t("diagnosis.recommendation")}
              </h3>
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all",
                      rec.priority === "high" 
                        ? "bg-rose-50 border border-rose-200" 
                        : rec.priority === "medium"
                          ? "bg-amber-50 border border-amber-200"
                          : "bg-slate-50 border border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      rec.priority === "high"
                        ? "bg-rose-100 text-rose-600"
                        : rec.priority === "medium"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-slate-100 text-slate-600"
                    )}>
                      {rec.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{rec.text}</p>
                    </div>
                    {rec.action === "book" && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                {t("diagnosis.close")}
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  onBookDoctor();
                }}
                className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                {t("diagnosis.bookNow")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default DiagnosisModal;






