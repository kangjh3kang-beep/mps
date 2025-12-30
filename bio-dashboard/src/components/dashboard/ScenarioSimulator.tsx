"use client";

import * as React from "react";
import {
  ArrowDown,
  Calculator,
  Dumbbell,
  Leaf,
  Pill,
  Scale,
  Send,
  Sparkles,
  CigaretteOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  type ChronicRiskAnalysis,
  type ScenarioInput,
  type ScenarioResult,
  simulateScenario,
  parseWhatIfQuestion
} from "@/lib/predictive-engine";

interface ScenarioSimulatorProps {
  chronicRisk: ChronicRiskAnalysis;
  locale?: "ko" | "en";
  className?: string;
}

const PRESET_SCENARIOS: { type: ScenarioInput["type"]; value: number; label: string; labelKo: string; icon: React.ReactNode }[] = [
  { type: "weight_loss", value: 5, label: "Lose 5kg", labelKo: "5kg 감량", icon: <Scale className="h-3 w-3" /> },
  { type: "exercise_increase", value: 30, label: "+30min/day exercise", labelKo: "하루 30분 운동", icon: <Dumbbell className="h-3 w-3" /> },
  { type: "diet_change", value: 1, label: "Mediterranean diet", labelKo: "지중해식 식단", icon: <Leaf className="h-3 w-3" /> },
  { type: "quit_smoking", value: 1, label: "Quit smoking", labelKo: "금연", icon: <CigaretteOff className="h-3 w-3" /> },
  { type: "medication_start", value: 1, label: "Start medication", labelKo: "약물 치료", icon: <Pill className="h-3 w-3" /> }
];

export function ScenarioSimulator({
  chronicRisk,
  locale = "ko",
  className
}: ScenarioSimulatorProps) {
  const isKo = locale === "ko";
  const [question, setQuestion] = React.useState("");
  const [result, setResult] = React.useState<ScenarioResult | null>(null);
  const [selectedPreset, setSelectedPreset] = React.useState<ScenarioInput | null>(null);

  const handlePresetClick = (preset: typeof PRESET_SCENARIOS[0]) => {
    const scenario: ScenarioInput = { type: preset.type, value: preset.value };
    setSelectedPreset(scenario);
    const simResult = simulateScenario(scenario, chronicRisk);
    setResult(simResult);
  };

  const handleQuestionSubmit = () => {
    const parsed = parseWhatIfQuestion(question);
    if (parsed) {
      setSelectedPreset(parsed);
      const simResult = simulateScenario(parsed, chronicRisk);
      setResult(simResult);
    } else {
      // Default to weight loss if can't parse
      const fallback: ScenarioInput = { type: "weight_loss", value: 3 };
      setSelectedPreset(fallback);
      const simResult = simulateScenario(fallback, chronicRisk);
      setResult(simResult);
    }
    setQuestion("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Question Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Calculator className="h-3 w-3" />
          {isKo ? '"만약 ~한다면?" 시나리오 시뮬레이터' : '"What if?" Scenario Simulator'}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuestionSubmit()}
            placeholder={isKo ? "예: 5kg 빼면 어떻게 돼?" : "e.g., What if I lose 5kg?"}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={handleQuestionSubmit}
            disabled={!question.trim()}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">
          {isKo ? "빠른 시나리오:" : "Quick scenarios:"}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all",
                selectedPreset?.type === preset.type && selectedPreset?.value === preset.value
                  ? "bg-sky-500 text-white"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {preset.icon}
              <span>{isKo ? preset.labelKo : preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-sky-50 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">
              {isKo ? "시뮬레이션 결과" : "Simulation Result"}
            </span>
          </div>

          {/* Risk Comparison */}
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <div className="text-[10px] text-muted-foreground mb-1">
                {isKo ? "현재 위험도" : "Current Risk"}
              </div>
              <div className="text-2xl font-bold text-rose-600">
                {result.originalRisk}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowDown className="h-5 w-5 text-emerald-500" />
              <Badge className="bg-emerald-500 text-white text-[10px]">
                -{result.riskReductionPct}%
              </Badge>
            </div>
            <div className="flex-1 text-center">
              <div className="text-[10px] text-muted-foreground mb-1">
                {isKo ? "예상 위험도" : "Projected Risk"}
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {result.newRisk}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{isKo ? "개선 효과" : "Improvement"}</span>
              <span>{result.riskReductionPct}%</span>
            </div>
            <Progress value={result.riskReductionPct} className="h-2" />
          </div>

          {/* Summary */}
          <p className="text-sm font-medium text-emerald-800">
            {isKo ? result.summaryKo : result.summary}
          </p>

          {/* Impact Details */}
          <div className="grid grid-cols-1 gap-2">
            {result.diabetesImpact && (
              <div className="rounded-lg bg-white/80 border px-3 py-2">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  🩸 {isKo ? "당뇨 영향" : "Diabetes Impact"}
                </div>
                <div className="text-xs">
                  {isKo ? result.diabetesImpactKo : result.diabetesImpact}
                </div>
              </div>
            )}
            {result.hypertensionImpact && (
              <div className="rounded-lg bg-white/80 border px-3 py-2">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  ❤️ {isKo ? "혈압 영향" : "Blood Pressure Impact"}
                </div>
                <div className="text-xs">
                  {isKo ? result.hypertensionImpactKo : result.hypertensionImpact}
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground text-center">
            {isKo
              ? "* 이 예측은 일반적인 의학 연구에 기반한 추정치입니다. 실제 결과는 개인에 따라 다를 수 있습니다."
              : "* This prediction is based on general medical research. Actual results may vary by individual."}
          </p>
        </div>
      )}

      {/* No result yet */}
      {!result && (
        <div className="rounded-xl border-2 border-dashed border-muted p-6 text-center">
          <Calculator className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {isKo
              ? "시나리오를 선택하거나 질문을 입력하세요"
              : "Select a scenario or type a question"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isKo
              ? '"만약 5kg을 빼면 어떻게 될까?"'
              : '"What if I lose 5kg?"'}
          </p>
        </div>
      )}
    </div>
  );
}

export default ScenarioSimulator;






