"use client";

import * as React from "react";
import { Fingerprint, KeyRound, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { auditLogger, type ElectronicSignature, type ReAuthMethod } from "@/lib/audit-logger";

export function ElectronicSignatureModal({
  open,
  onOpenChange,
  signerId,
  title,
  description,
  meaningOptions,
  defaultMeaning,
  dataToSign,
  onSigned,
  className
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signerId: string;
  title: string;
  description?: string;
  meaningOptions: string[];
  defaultMeaning?: string;
  dataToSign: unknown;
  onSigned: (sig: ElectronicSignature, dataChecksum: string) => void | Promise<void>;
  className?: string;
}) {
  const [method, setMethod] = React.useState<ReAuthMethod>("password");
  const [password, setPassword] = React.useState("");
  const [biometricOk, setBiometricOk] = React.useState(false);
  const [meaning, setMeaning] = React.useState(defaultMeaning ?? meaningOptions[0] ?? "");
  const [isSigning, setIsSigning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setMethod("password");
      setPassword("");
      setBiometricOk(false);
      setMeaning(defaultMeaning ?? meaningOptions[0] ?? "");
      setIsSigning(false);
      setError(null);
    }
  }, [open, defaultMeaning, meaningOptions]);

  const canSubmit =
    !!meaning.trim() &&
    (method === "password" ? password.trim().length >= 4 : biometricOk) &&
    !isSigning;

  const handleSign = async () => {
    setError(null);
    setIsSigning(true);
    try {
      // Simulated re-authentication
      if (method === "password") {
        if (password.trim().length < 4) throw new Error("비밀번호를 4자 이상 입력해주세요.");
        // demo: accept any password of length >= 4
      } else {
        if (!biometricOk) throw new Error("생체인증을 완료해주세요.");
      }

      const dataChecksum = await auditLogger.checksumOfDataRecord(dataToSign);
      const sig = await auditLogger.createElectronicSignature({
        signerId,
        reAuthMethod: method,
        meaning: meaning.trim(),
        dataChecksum
      });

      await onSigned(sig, dataChecksum);
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message ?? "서명에 실패했습니다.");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description ?? "21 CFR Part 11 준수를 위해 재인증과 서명 의미 확인이 필요합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Signer: <span className="font-medium text-foreground">{signerId}</span>
          </div>

          {/* Re-auth method */}
          <div className="grid grid-cols-2 gap-2">
            <button
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                method === "password" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"
              )}
              onClick={() => setMethod("password")}
              type="button"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-700" />
                <div className="text-sm font-medium">비밀번호</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">재로그인(모킹)</div>
            </button>
            <button
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                method === "biometric" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"
              )}
              onClick={() => setMethod("biometric")}
              type="button"
            >
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-slate-700" />
                <div className="text-sm font-medium">생체인증</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Touch/Face (모킹)</div>
            </button>
          </div>

          {method === "password" ? (
            <div className="space-y-1">
              <div className="text-xs font-medium">Password</div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
              />
              <div className="text-[11px] text-muted-foreground">데모: 4자 이상이면 통과</div>
            </div>
          ) : (
            <label className="flex items-center gap-2 rounded-lg border p-3 bg-muted/20">
              <input
                type="checkbox"
                checked={biometricOk}
                onChange={(e) => setBiometricOk(e.target.checked)}
              />
              <div className="text-sm">생체인증 완료(모킹)</div>
              {biometricOk && <Badge variant="secondary">Verified</Badge>}
            </label>
          )}

          {/* Meaning of signature */}
          <div className="space-y-1">
            <div className="text-xs font-medium">Meaning of Signature</div>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm bg-white"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
            >
              {meaningOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="text-xs text-rose-600">{error}</div>}

          <div className="flex gap-2 pt-1">
            <Button className="flex-1" disabled={!canSubmit} onClick={handleSign}>
              {isSigning ? "Signing..." : "Sign & Continue"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSigning}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ElectronicSignatureModal;







