"use client";

import * as React from "react";
import { Check, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type PersonaId,
  type Persona,
  type PersonaRecommendation,
  type MultiPersonaContext,
  PERSONAS,
  getPersonaRecommendations
} from "@/lib/persona-manager";

interface CouncilChamberProps {
  currentPersona: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
  context: MultiPersonaContext;
  /** If true, show compact horizontal selector instead of full grid */
  compact?: boolean;
  /** Locale for labels */
  locale?: "ko" | "en";
}

/**
 * Council Chamber UI - Select which AI persona to talk to
 */
export function CouncilChamber({
  currentPersona,
  onSelectPersona,
  context,
  compact = false,
  locale = "ko"
}: CouncilChamberProps) {
  const [showRecommendations, setShowRecommendations] = React.useState(false);
  const recommendations = React.useMemo(
    () => getPersonaRecommendations(context),
    [context]
  );

  const personas = Object.values(PERSONAS);
  const isKo = locale === "ko";

  // Get recommendation for a specific persona
  const getRecommendation = (id: PersonaId): PersonaRecommendation | undefined => {
    return recommendations.find((r) => r.persona === id);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {/* Auto-Select Button */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs gap-1"
          onClick={() => {
            if (recommendations.length > 0) {
              onSelectPersona(recommendations[0].persona);
            }
          }}
          disabled={recommendations.length === 0}
        >
          <Sparkles className="h-3 w-3" />
          Auto
        </Button>

        {/* Persona Pills */}
        {personas.map((p) => {
          const isActive = currentPersona === p.id;
          const rec = getRecommendation(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? `${p.bgColor} ${p.borderColor} border-2 ${p.color}`
                  : "border border-muted bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <span>{p.emoji}</span>
              <span>{isKo ? p.nameKo : p.name}</span>
              {rec && !isActive && (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              {isActive && <Check className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Full grid view
  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">
              {isKo ? "AI 회의실 (Council Chamber)" : "AI Council Chamber"}
            </CardTitle>
          </div>
          {recommendations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {isKo ? "추천 보기" : "View Suggestions"}
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          {isKo
            ? "전문 AI와 대화하세요. 자동 선택하거나 직접 고르세요."
            : "Talk to specialized AIs. Auto-select or choose manually."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Recommendations Banner */}
        {showRecommendations && recommendations.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 space-y-1.5">
            <div className="text-xs font-medium text-amber-800">
              {isKo ? "📊 데이터 기반 추천" : "📊 Data-Based Suggestions"}
            </div>
            {recommendations.slice(0, 3).map((rec, idx) => {
              const persona = PERSONAS[rec.persona];
              return (
                <button
                  key={idx}
                  onClick={() => onSelectPersona(rec.persona)}
                  className="w-full flex items-center gap-2 rounded-md bg-white p-2 text-left hover:bg-amber-100/50 transition-colors"
                >
                  <span className="text-lg">{persona.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-amber-900 truncate">
                      {isKo ? persona.nameKo : persona.name}
                    </div>
                    <div className="text-[10px] text-amber-700 truncate">
                      {isKo ? rec.reasonKo : rec.reason}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    {rec.priority}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}

        {/* Persona Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {personas.map((p) => {
            const isActive = currentPersona === p.id;
            const rec = getRecommendation(p.id);

            return (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all",
                  isActive
                    ? `${p.bgColor} ${p.borderColor} border-2 shadow-sm`
                    : "border border-muted bg-background hover:bg-muted/50"
                )}
              >
                {/* Notification dot */}
                {rec && !isActive && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}

                {/* Active check */}
                {isActive && (
                  <span className="absolute top-1 right-1">
                    <Check className={cn("h-3.5 w-3.5", p.color)} />
                  </span>
                )}

                <span className="text-2xl">{p.emoji}</span>
                <span className={cn("text-xs font-medium", isActive ? p.color : "text-foreground")}>
                  {isKo ? p.nameKo : p.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {isKo ? p.specialtyKo : p.specialty}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Persona Info */}
        <div
          className={cn(
            "rounded-lg p-3 text-sm",
            PERSONAS[currentPersona].bgColor,
            PERSONAS[currentPersona].borderColor,
            "border"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{PERSONAS[currentPersona].emoji}</span>
            <span className={cn("font-medium", PERSONAS[currentPersona].color)}>
              {isKo ? PERSONAS[currentPersona].nameKo : PERSONAS[currentPersona].name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isKo ? PERSONAS[currentPersona].greetingKo : PERSONAS[currentPersona].greeting}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Floating persona indicator (shows current persona in a small badge)
 */
export function PersonaIndicator({
  personaId,
  onClick,
  locale = "ko"
}: {
  personaId: PersonaId;
  onClick?: () => void;
  locale?: "ko" | "en";
}) {
  const persona = PERSONAS[personaId];
  const isKo = locale === "ko";

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all hover:opacity-80",
        persona.bgColor,
        persona.borderColor,
        persona.color,
        "border"
      )}
    >
      <span>{persona.emoji}</span>
      <span>{isKo ? persona.nameKo : persona.name}</span>
    </button>
  );
}






