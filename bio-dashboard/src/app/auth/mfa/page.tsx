"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { authenticator } from "otplib";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MfaPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/";
  const { data: session, status, update } = useSession();

  const [otpauth, setOtpauth] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === "unauthenticated") router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/auth/mfa")}`);
  }, [status, router]);

  const mfaEnabled = (session?.user as any)?.mfaEnabled as boolean | undefined;
  const mfaVerified = (session?.user as any)?.mfaVerified as boolean | undefined;

  async function setup() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/mfa/setup", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      setSecret(json.secret);
      setOtpauth(json.otpauth);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);

      // Update NextAuth JWT to mark MFA verified
      await update({ mfaVerified: true } as any);
      router.push(callbackUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-700" />
            MFA(2단계 인증)
          </CardTitle>
          <CardDescription>건강 데이터 접근을 위해 MFA가 필요합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              Enabled: {String(!!mfaEnabled)}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Verified: {String(!!mfaVerified)}
            </Badge>
          </div>

          {!mfaEnabled && (
            <Button className="w-full" variant="outline" onClick={setup} disabled={loading}>
              {loading ? "설정 중..." : "MFA 설정 시작(QR 생성)"}
            </Button>
          )}

          {(otpauth || mfaEnabled) && (
            <div className="rounded-xl border bg-white p-3 space-y-2">
              <div className="text-xs font-semibold">Authenticator 앱으로 스캔</div>
              {otpauth ? (
                <div className="flex items-center justify-center">
                  <QRCodeSVG value={otpauth} size={180} />
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  이미 MFA가 설정되어 있습니다. 앱에서 6자리 코드를 입력하세요.
                </div>
              )}
              {secret && (
                <div className="text-[11px] text-muted-foreground">
                  Secret(backup): <span className="font-mono">{secret}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <div className="text-xs font-medium">인증 코드(6자리)</div>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
          </div>

          {error && (
            <div className="text-xs text-rose-600 border border-rose-200 bg-rose-50 rounded-lg p-2">
              {error}
            </div>
          )}

          <Button className="w-full" onClick={verify} disabled={loading || code.trim().length < 6}>
            {loading ? "검증 중..." : "검증 후 계속"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}






