"use client";

import * as React from "react";
import { Activity, Eraser, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function SensorSimulator({
  logs,
  onMeasure,
  onClear
}: {
  logs: { ts: number; lines: string[] }[];
  onMeasure: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Sensor Mocking (Part 3)
          </CardTitle>
          <CardDescription>
            ‘측정’ 버튼을 누르면 Raw 신호(노이즈 포함) → 차동 처리 → Kalman Filter →
            보정 농도값 과정을 로그로 보여줍니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Button onClick={onMeasure} className="flex-1">
            <PlayCircle className="mr-2 h-4 w-4" />
            측정
          </Button>
          <Button variant="outline" onClick={onClear} aria-label="로그 비우기">
            <Eraser className="mr-2 h-4 w-4" />
            비우기
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>처리 로그</CardTitle>
          <CardDescription>개발 테스트용 텍스트 로그</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "h-[42vh] overflow-auto rounded-xl border bg-background p-3 font-mono text-xs leading-relaxed",
              logs.length === 0 && "flex items-center justify-center text-muted-foreground"
            )}
          >
            {logs.length === 0 ? (
              <div>아직 로그가 없습니다. ‘측정’을 눌러주세요.</div>
            ) : (
              <div className="space-y-3">
                {logs
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div key={entry.ts} className="space-y-2">
                      <div className="text-muted-foreground">
                        {new Date(entry.ts).toLocaleString()}
                      </div>
                      <Separator />
                      <pre className="whitespace-pre-wrap">
                        {entry.lines.map((l) => `- ${l}`).join("\n")}
                      </pre>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







