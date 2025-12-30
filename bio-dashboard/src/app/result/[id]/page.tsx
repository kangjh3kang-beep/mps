"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FlaskConical, List } from "lucide-react";

import { I18nProvider } from "@/lib/i18n";
import { UserProvider, useUser } from "@/context/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResultPage } from "@/components/dashboard/ResultPage";
import { deepAnalysisStore, type DeepAnalysisPacket } from "@/lib/deep-analysis";
import { computeHealthScore } from "@/lib/bio";
import { useAppToast } from "@/components/system/AppToast";
import { cn } from "@/lib/utils";

function mgDlToMmolL_Lactate(mgDl: number) {
  return mgDl / 9.008;
}

function ResultDetailInner() {
  const user = useUser();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useAppToast();
  const measurementId = params?.id;

  const measurement = React.useMemo(() => {
    if (!measurementId) return null;
    return user.measurements.find((m) => m.id === measurementId) ?? null;
  }, [user.measurements, measurementId]);

  const recentIds = React.useMemo(() => {
    return user.measurements
      .slice()
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 7)
      .map((m) => m.id);
  }, [user.measurements]);

  const navIndex = React.useMemo(() => {
    if (!measurementId) return -1;
    return recentIds.findIndex((x) => x === measurementId);
  }, [recentIds, measurementId]);

  const newerId = navIndex > 0 ? recentIds[navIndex - 1] : null; // 더 최신
  const olderId = navIndex >= 0 && navIndex < recentIds.length - 1 ? recentIds[navIndex + 1] : null; // 더 과거

  const goNewer = React.useCallback(() => {
    if (!newerId) {
      toast({ title: "이전(더 최신) 측정 없음", description: "최근 7개 범위의 가장 최신 측정입니다.", variant: "warning" });
      return;
    }
    router.push(`/result/${encodeURIComponent(newerId)}`);
  }, [newerId, router, toast]);

  const goOlder = React.useCallback(() => {
    if (!olderId) {
      toast({ title: "다음(더 과거) 측정 없음", description: "최근 7개 범위의 가장 과거 측정입니다.", variant: "warning" });
      return;
    }
    router.push(`/result/${encodeURIComponent(olderId)}`);
  }, [olderId, router, toast]);

  const healthScore = React.useMemo(() => {
    if (!measurement) return user.healthScore;
    const sorted = user.measurements.slice().sort((a, b) => a.ts - b.ts);
    const idx = sorted.findIndex((m) => m.id === measurement.id);
    const last7 = (idx >= 0 ? sorted.slice(Math.max(0, idx - 6), idx + 1) : sorted.slice(-7))
      .map((m) => m.concentrationMmolL);
    return computeHealthScore(measurement.concentrationMmolL, last7);
  }, [measurement, user.measurements, user.healthScore]);

  const [deepPacket, setDeepPacket] = React.useState<DeepAnalysisPacket | null>(null);
  React.useEffect(() => {
    if (!measurementId) return;
    const packetId = measurement?.deepPacketId ?? `DAP-${measurementId}`;
    setDeepPacket(deepAnalysisStore.get(packetId));
  }, [measurementId, measurement?.deepPacketId]);

  const uncertaintyAbs = React.useMemo(() => {
    if (!deepPacket) return undefined;
    if (deepPacket.layer3.unit === "mg/dL") return mgDlToMmolL_Lactate(deepPacket.layer3.confidenceIntervalAbs);
    return deepPacket.layer3.confidenceIntervalAbs;
  }, [deepPacket]);

  if (!measurementId) {
    return <div className="min-h-dvh flex items-center justify-center text-muted-foreground">Invalid route.</div>;
  }

  if (!measurement) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="text-lg font-semibold">결과</div>
              <div className="text-xs text-muted-foreground">측정 ID를 찾을 수 없습니다.</div>
            </div>
          </div>

          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle>Measurement not found</CardTitle>
              <CardDescription>
                measurementId: <span className="font-mono">{measurementId}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/result" prefetch={false}>
                  <List className="w-4 h-4 mr-1" />
                  목록으로
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30">
      <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-24">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="text-lg font-semibold">Dual‑View 결과</div>
              <div className="text-xs text-muted-foreground font-mono">{measurement.id}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {new Date(measurement.ts).toLocaleString("ko-KR")}
            </Badge>
            {recentIds.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("h-7 px-2 text-xs", !newerId && "opacity-50")}
                  title="이전(더 최신) 측정"
                  onClick={goNewer}
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  이전
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("h-7 px-2 text-xs", !olderId && "opacity-50")}
                  title="다음(더 과거) 측정"
                  onClick={goOlder}
                >
                  다음
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
                {navIndex >= 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    최근 7개 중 {navIndex + 1}/{recentIds.length}
                  </Badge>
                )}
              </div>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/result" prefetch={false}>
                <List className="w-4 h-4 mr-1" />
                목록
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/deep-analysis/${encodeURIComponent(measurement.id)}`} prefetch={false}>
                <FlaskConical className="w-4 h-4 mr-1" />
                Deep Analysis
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border shadow-md">
          <CardContent className="p-4">
            <ResultPage
              healthScore={healthScore}
              concentrationMmolL={measurement.concentrationMmolL}
              uncertaintyAbs={uncertaintyAbs}
              deepPacket={deepPacket}
              userProfile={{ age: 45, gender: "other", conditions: [], goals: user.goals }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Mobile bottom navigation bar */}
      {recentIds.length > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <div className="mx-auto max-w-4xl px-4 py-2 flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              className={cn("h-9 flex-1", !newerId && "opacity-60")}
              onClick={goNewer}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              이전
            </Button>

            <div className="text-[11px] text-muted-foreground text-center min-w-[96px]">
              {navIndex >= 0 ? (
                <div>
                  최근 7개
                  <div className="font-mono text-foreground">
                    {navIndex + 1}/{recentIds.length}
                  </div>
                </div>
              ) : (
                <div>최근 7개</div>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              className={cn("h-9 flex-1", !olderId && "opacity-60")}
              onClick={goOlder}
            >
              다음
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      )}
    </div>
  );
}

export default function ResultDetailPage() {
  return (
    <I18nProvider>
      <UserProvider>
        <ResultDetailInner />
      </UserProvider>
    </I18nProvider>
  );
}


