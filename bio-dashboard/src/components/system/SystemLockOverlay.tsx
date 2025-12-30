"use client";

import * as React from "react";
import { ShieldAlert, Lock, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auditLogger } from "@/lib/audit-logger";

export function SystemLockOverlay({
  open,
  reason,
  className
}: {
  open: boolean;
  reason?: string;
  className?: string;
}) {
  const [exporting, setExporting] = React.useState(false);

  if (!open) return null;

  const exportAudit = async () => {
    setExporting(true);
    try {
      const log = auditLogger.getLog();
      const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manpasik-audit-log-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={cn("fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm", className)}>
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-slate-900">Data Integrity Breach</div>
              <div className="text-sm text-slate-600 mt-1">
                감사 로그 무결성 검증에 실패했습니다. 시스템은 안전을 위해 <b>잠금(LOCK)</b> 상태로 전환됩니다.
              </div>
              {reason ? (
                <div className="mt-3 rounded-lg border bg-rose-50/50 p-3 text-xs text-rose-800">
                  <div className="font-medium mb-1">Details</div>
                  <div className="break-words">{reason}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Button className="w-full" onClick={exportAudit} disabled={exporting}>
              <FileDown className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export Audit Log"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              <Lock className="w-4 h-4 mr-2" />
              Reload (Locked)
            </Button>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            * 데모 환경에서는 localStorage 기반이며, 변조 탐지는 SHA-256 체인으로 수행됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemLockOverlay;







