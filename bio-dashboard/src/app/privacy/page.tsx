"use client";

import * as React from "react";
import { Shield, Lock, FlaskConical, Megaphone, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { consentManager, type ConsentType, anonymizePayload } from "@/lib/privacy-guard";
import { Separator } from "@/components/ui/separator";
import { ElectronicSignatureModal } from "@/components/system/ElectronicSignatureModal";
import { auditLogger, type ElectronicSignature } from "@/lib/audit-logger";

function ConsentRow({
  userId,
  type,
  title,
  description,
  icon
  ,
  eSignPolicy
}: {
  userId: string;
  type: ConsentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  /** Policy-based e-sign enforcement */
  eSignPolicy: "required" | "none";
}) {
  const [latest, setLatest] = React.useState(() => consentManager.getUserLatest(userId)[type]);
  const [sigOpen, setSigOpen] = React.useState(false);
  const [pending, setPending] = React.useState<{ status: "Granted" | "Revoked"; tsUtc: string } | null>(null);

  const commit = async (status: "Granted" | "Revoked", signature?: ElectronicSignature, tsUtc?: string) => {
    const oldVal = { consentType: type, status: latest };
    const newVal = { consentType: type, status };

    const rec = consentManager.set(userId, type, status, { timestampUtc: tsUtc });
    setLatest(status);

    await auditLogger.logAction(
      userId,
      "UPDATE",
      oldVal,
      newVal,
      `Consent ${type} → ${status}`,
      {
        recordType: "UserConsent",
        recordId: rec.id,
        signature,
        dataRecord: rec
      }
    );
  };

  const setStatus = (status: "Granted" | "Revoked") => {
    if (eSignPolicy !== "required") {
      void commit(status);
      return;
    }
    setPending({ status, tsUtc: new Date().toISOString() });
    setSigOpen(true);
  };

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm">{title}</div>
            <Badge
              className={
                latest === "Granted"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]"
                  : "bg-slate-100 text-slate-700 border border-slate-200 text-[10px]"
              }
            >
              {latest}
            </Badge>
          {eSignPolicy === "required" && (
            <Badge className="bg-sky-100 text-sky-800 border border-sky-200 text-[10px]">
              E‑SIGN REQUIRED
            </Badge>
          )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={latest === "Granted" ? "default" : "outline"} onClick={() => setStatus("Granted")}>
          Grant
        </Button>
        <Button size="sm" variant={latest === "Revoked" ? "default" : "outline"} onClick={() => setStatus("Revoked")}>
          Revoke
        </Button>
      </div>

      <ElectronicSignatureModal
        open={sigOpen}
        onOpenChange={(open) => {
          setSigOpen(open);
          if (!open) setPending(null);
        }}
        signerId={userId}
        title="전자서명: Consent 변경"
        description="동의 변경은 전자서명이 필요합니다 (Part 11)."
        meaningOptions={["I have reviewed", "I approve this change", "I consent"]}
        defaultMeaning="I approve this change"
        dataToSign={{
          userId,
          consentType: type,
          status: pending?.status,
          timestampUtc: pending?.tsUtc
        }}
        onSigned={async (sig) => {
          if (!pending) return;
          await commit(pending.status, sig, pending.tsUtc);
          setPending(null);
        }}
      />
    </div>
  );
}

export default function PrivacyPage() {
  const userId = "demo-user";
  // Policy: High-risk consents must always be electronically signed.
  // Marketing is optional (user choice).
  const [marketingESignEnabled, setMarketingESignEnabled] = React.useState(false);

  const [preview, setPreview] = React.useState<string>("");

  const makePreview = async () => {
    const payload = await anonymizePayload({
      name: "홍길동",
      phone: "+82-10-1234-5678",
      email: "demo@example.com",
      birthDate: "1990-03-15",
      location: { lat: 37.5665, lon: 126.9780, country: "KR" },
      // medical data should stay intact:
      glucose: 102,
      ecg: [0.01, 0.02, 0.03]
    });
    setPreview(JSON.stringify(payload, null, 2));
  };

  React.useEffect(() => {
    makePreview();
  }, []);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-4">
        <Card className="border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-600" />
              Privacy Guard (HIPAA/GDPR)
            </CardTitle>
            <CardDescription>동의 관리 + 비식별화(De-identification) 정책</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border bg-white p-3">
              <div>
                <div className="text-sm font-semibold">Part 11 전자서명 정책</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Research/Third-party는 항상 전자서명 필수입니다. Marketing은 선택 사항입니다.
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={marketingESignEnabled}
                  onChange={(e) => setMarketingESignEnabled(e.target.checked)}
                />
                Marketing 전자서명 사용
              </label>
            </div>

            <ConsentRow
              userId={userId}
              type="Research"
              title="Research Consent"
              description="Research 동의가 없으면 /api/analyze 업로드가 차단되고 로컬 분석으로만 처리됩니다."
              icon={<FlaskConical className="w-5 h-5 text-sky-700" />}
              eSignPolicy="required"
            />
            <ConsentRow
              userId={userId}
              type="Marketing"
              title="Marketing Consent"
              description="마케팅 목적의 커뮤니케이션 수신 동의."
              icon={<Megaphone className="w-5 h-5 text-sky-700" />}
              eSignPolicy={marketingESignEnabled ? "required" : "none"}
            />
            <ConsentRow
              userId={userId}
              type="Third-party"
              title="Third-party Sharing"
              description="제3자(파트너/외부기관) 공유 동의."
              icon={<Share2 className="w-5 h-5 text-sky-700" />}
              eSignPolicy="required"
            />
          </CardContent>
        </Card>

        <Card className="border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-600" />
              De-identification Preview
            </CardTitle>
            <CardDescription>PII는 해시 ID로 대체되고, 위치/생년월일은 축약됩니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={makePreview}>
              Preview Refresh
            </Button>
            <Separator />
            <pre className="text-[11px] rounded-lg border bg-white p-3 overflow-auto max-h-[320px]">
              {preview}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


