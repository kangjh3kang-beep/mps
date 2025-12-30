"use client";

import * as React from "react";
import { FileText, Sparkles, Link as LinkIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GeneratedReport } from "@/lib/reporting";

type Props = {
  report: GeneratedReport | null;
  goals?: string[];
  onGenerate?: () => void;
  onFocusOxidationPeak?: () => void;
  className?: string;
};

function renderReportRichText(args: {
  text: string;
  onFocusOxidationPeak?: () => void;
}) {
  const { text, onFocusOxidationPeak } = args;

  // Simple "rich text" renderer:
  // - "Instant Action Required" => bold red
  // - "[[OXIDATION_PEAK]]" => clickable chip/link that triggers focus
  const parts: React.ReactNode[] = [];

  const lines = text.split("\n");
  lines.forEach((line, idx) => {
    const key = `l-${idx}`;

    const segments: React.ReactNode[] = [];
    const tokens = line.split(/(\[\[OXIDATION_PEAK\]\]|Instant Action Required\.)/g);
    tokens.forEach((tok, j) => {
      if (!tok) return;
      if (tok === "Instant Action Required.") {
        segments.push(
          <span key={`${key}-iar-${j}`} className="font-bold text-rose-700">
            Instant Action Required.
          </span>
        );
        return;
      }
      if (tok === "[[OXIDATION_PEAK]]") {
        segments.push(
          <button
            key={`${key}-ox-${j}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
              "bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100"
            )}
            onClick={() => onFocusOxidationPeak?.()}
            type="button"
          >
            <LinkIcon className="w-3 h-3" />
            Oxidation Peak
          </button>
        );
        return;
      }
      segments.push(<span key={`${key}-t-${j}`}>{tok}</span>);
    });

    // headings
    if (line.startsWith("### ")) {
      parts.push(
        <div key={key} className="mt-3 first:mt-0 text-sm font-semibold text-slate-900">
          {line.replace(/^###\s+/, "")}
        </div>
      );
      return;
    }

    // bullets
    if (line.trim().startsWith("- ")) {
      parts.push(
        <div key={key} className="text-sm text-slate-700 flex gap-2">
          <span className="text-slate-400">•</span>
          <div className="min-w-0">{segments}</div>
        </div>
      );
      return;
    }

    // empty line spacing
    if (line.trim().length === 0) {
      parts.push(<div key={key} className="h-2" />);
      return;
    }

    parts.push(
      <div key={key} className="text-sm text-slate-700">
        {segments}
      </div>
    );
  });

  return parts;
}

export function ReportSmartCard({ report, goals = [], onGenerate, onFocusOxidationPeak, className }: Props) {
  return (
    <Card className={cn("border shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-700" />
              AI Narrative Report
            </CardTitle>
            <CardDescription className="text-xs">
              Context-aware prompt + knowledge mapping(시뮬) + footnotes
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {goals.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 mr-1">
                {goals.slice(0, 3).map((g) => (
                  <Badge key={g} variant="outline" className="text-[10px]">
                    {g}
                  </Badge>
                ))}
                {goals.length > 3 && (
                  <Badge variant="secondary" className="text-[10px]">
                    +{goals.length - 3}
                  </Badge>
                )}
              </div>
            )}
            {report?.tags.instantActionRequired ? (
              <Badge variant="outline" className="text-[10px] border-rose-200 text-rose-700 bg-rose-50">
                Instant Action Required
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Normal
              </Badge>
            )}
            {onGenerate && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onGenerate}>
                <Sparkles className="w-4 h-4 mr-1" />
                Generate
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!report ? (
          <div className="text-sm text-muted-foreground">보고서가 아직 생성되지 않았습니다.</div>
        ) : (
          <>
            <div className="rounded-xl border bg-white p-3">
              <div className="space-y-1">
                {renderReportRichText({ text: report.bodyText, onFocusOxidationPeak })}
              </div>
            </div>

            {report.footnotes.length > 0 && (
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs font-semibold text-slate-900">Footnotes</div>
                <div className="mt-2 space-y-1">
                  {report.footnotes.map((f) => (
                    <div key={f.id} className="text-xs text-slate-700">
                      <span className="font-mono text-slate-500">[{f.id}]</span> {f.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <details className="rounded-xl border bg-white p-3">
              <summary className="cursor-pointer text-xs font-semibold text-slate-900">Prompt (LLM)</summary>
              <pre className="mt-2 text-[11px] text-slate-700 whitespace-pre-wrap font-mono">
                {report.prompt}
              </pre>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}


