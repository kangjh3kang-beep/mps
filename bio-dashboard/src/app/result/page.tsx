"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, FlaskConical } from "lucide-react";

import { I18nProvider } from "@/lib/i18n";
import { UserProvider, useUser } from "@/context/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function ResultListInner() {
  const user = useUser();

  const items = React.useMemo(() => {
    return user.measurements.slice().sort((a, b) => b.ts - a.ts);
  }, [user.measurements]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30 overflow-x-hidden overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="text-lg font-semibold">측정 결과</div>
            <div className="text-xs text-muted-foreground">측정을 선택하면 Dual‑View 결과 화면으로 이동합니다.</div>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle>측정 기록이 없습니다</CardTitle>
              <CardDescription>먼저 측정을 1회 수행한 뒤 다시 확인하세요.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 30).map((m) => (
              <Card key={m.id} className="border shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        <span className="font-mono">{m.id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(m.ts).toLocaleString("ko-KR")}
                      </div>
                      <div className="text-sm mt-2">
                        젖산: <span className="font-mono">{m.concentrationMmolL.toFixed(2)}</span> mmol/L
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {m.schemaVersion === 2 ? (
                        <Badge variant="secondary" className="text-[10px]">
                          v2
                        </Badge>
                      ) : null}
                      {m.deepPacketId ? (
                        <Badge variant="outline" className="text-[10px]">
                          Deep OK
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Deep ?
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/result/${encodeURIComponent(m.id)}`} prefetch={false}>
                        <FileText className="w-4 h-4 mr-1" />
                        결과 보기
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/deep-analysis/${encodeURIComponent(m.id)}`} prefetch={false}>
                        <FlaskConical className="w-4 h-4 mr-1" />
                        Deep
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultListPage() {
  return (
    <I18nProvider>
      <UserProvider>
        <ResultListInner />
      </UserProvider>
    </I18nProvider>
  );
}






