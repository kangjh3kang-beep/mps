"use client";

import * as React from "react";
import { FileDown, Filter, RefreshCw, ShieldCheck, ShieldAlert, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { auditLogger, type AuditActionType, type AuditRecord, type VerifyRecordResult } from "@/lib/audit-logger";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type VerifyState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; message: string; count: number }
  | { status: "error"; message: string };

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function shortHash(h?: string, len = 8) {
  if (!h) return "";
  if (h === "GENESIS") return "GENESIS";
  return h.slice(0, len);
}

function parseUtcIsoOrEmpty(s: string): number | null {
  const v = s.trim();
  if (!v) return null;
  // Expect ISO string; Date.parse handles Z or offset.
  const ms = Date.parse(v);
  if (!Number.isFinite(ms)) return null;
  return ms;
}

function safeJson(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  const needs = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needs ? `"${escaped}"` : escaped;
}

function buildCsv(records: AuditRecord[]) {
  const header = [
    "timestampUtc",
    "userId",
    "actionType",
    "recordType",
    "recordId",
    "reason",
    "dataChecksum",
    "prevChecksum",
    "checksum",
    "signature.signerId",
    "signature.reAuthMethod",
    "signature.meaning",
    "signature.signedAtUtc",
    "signature.signatureHash"
  ];
  const lines = [header.join(",")];
  for (const r of records) {
    lines.push(
      [
        r.timestampUtc,
        r.userId,
        r.actionType,
        r.recordType ?? "",
        r.recordId ?? "",
        r.reason ?? "",
        r.dataChecksum ?? "",
        r.prevChecksum,
        r.checksum,
        r.signature?.signerId ?? "",
        r.signature?.reAuthMethod ?? "",
        r.signature?.meaning ?? "",
        r.signature?.signedAtUtc ?? "",
        r.signature?.signatureHash ?? ""
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return lines.join("\n");
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildPrintableHtml(opts: {
  generatedAtUtc: string;
  verify: VerifyState;
  filters: { userId: string; action: string; recordType: string; query: string; fromUtc: string; toUtc: string; signatureOnly: boolean };
  records: AuditRecord[];
}) {
  const { generatedAtUtc, verify, filters, records } = opts;
  const status =
    verify.status === "ok"
      ? `OK (${verify.count})`
      : verify.status === "error"
        ? `ERROR`
        : verify.status === "checking"
          ? "CHECKING"
          : "UNKNOWN";

  const rows = records
    .map(
      (r) => `
    <tr>
      <td>${r.timestampUtc}</td>
      <td>${r.userId}</td>
      <td>${r.actionType}</td>
      <td>${r.recordType ?? ""}</td>
      <td>${r.recordId ?? ""}</td>
      <td>${(r.reason ?? "").replace(/</g, "&lt;")}</td>
      <td>${r.signature ? "YES" : ""}</td>
      <td><code>${shortHash(r.checksum, 10)}</code></td>
    </tr>`
    )
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Manpasik Part 11 Audit Report</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .muted { color: #475569; font-size: 12px; }
        .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-top: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
        th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f8fafc; font-weight: 700; }
        code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; }
        @media print { .noprint { display: none; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="noprint" style="margin-bottom: 12px;">
        <button onclick="window.print()">Print / Save as PDF</button>
      </div>
      <h1>Manpasik Audit Trail Report (21 CFR Part 11)</h1>
      <div class="muted">Generated (UTC): ${generatedAtUtc}</div>
      <div class="box">
        <div><b>Integrity</b>: ${status}</div>
        <div class="muted">${verify.status === "ok" ? verify.message : verify.status === "error" ? verify.message : ""}</div>
        <div style="margin-top:8px;"><b>Filters</b>:
          userId="${filters.userId || "ALL"}",
          action="${filters.action || "ALL"}",
          recordType="${filters.recordType || "ALL"}",
          fromUtc="${filters.fromUtc || "ALL"}",
          toUtc="${filters.toUtc || "ALL"}",
          signatureOnly="${filters.signatureOnly ? "YES" : "NO"}",
          query="${filters.query || ""}"
        </div>
        <div class="muted">Records in report: ${records.length}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>UTC Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Record Type</th>
            <th>Record ID</th>
            <th>Reason</th>
            <th>E-Sign</th>
            <th>Checksum</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
  </html>`;
}

export default function AuditReportPage() {
  const [all, setAll] = React.useState<AuditRecord[]>([]);
  const [verify, setVerify] = React.useState<VerifyState>({ status: "idle" });
  const [verifyById, setVerifyById] = React.useState<Record<string, VerifyRecordResult>>({});

  // filters
  const [userId, setUserId] = React.useState("");
  const [action, setAction] = React.useState<"" | AuditActionType>("");
  const [recordType, setRecordType] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [fromMs, setFromMs] = React.useState<number | null>(null);
  const [toMs, setToMs] = React.useState<number | null>(null);
  const [signatureOnly, setSignatureOnly] = React.useState(false);
  const [failOnly, setFailOnly] = React.useState(false);
  const [pinFailToTop, setPinFailToTop] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setAll(auditLogger.getLog().slice().reverse()); // newest first
    setVerify({ status: "checking" });
    const detailed = await auditLogger.verifyChainDetailed();
    setVerify(
      detailed.ok ? { status: "ok", message: detailed.message, count: detailed.count } : { status: "error", message: detailed.message }
    );
    const map: Record<string, VerifyRecordResult> = {};
    for (const rr of detailed.results) map[rr.id] = rr;
    setVerifyById(map);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const users = React.useMemo(() => uniq(all.map((r) => r.userId)), [all]);
  const types = React.useMemo(() => uniq(all.map((r) => r.recordType ?? "")), [all]);

  const filteredBase = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((r) => {
      if (userId && r.userId !== userId) return false;
      if (action && r.actionType !== action) return false;
      if (recordType && (r.recordType ?? "") !== recordType) return false;
      if (signatureOnly && !r.signature) return false;

      if (fromMs !== null) {
        const t = Date.parse(r.timestampUtc);
        if (Number.isFinite(t) && t < fromMs) return false;
      }
      if (toMs !== null) {
        const t = Date.parse(r.timestampUtc);
        if (Number.isFinite(t) && t > toMs) return false;
      }

      if (!q) return true;
      const hay = [
        r.userId,
        r.actionType,
        r.recordType ?? "",
        r.recordId ?? "",
        r.reason ?? "",
        r.checksum,
        r.prevChecksum,
        r.signature?.meaning ?? "",
        r.signature?.signerId ?? ""
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [all, userId, action, recordType, query, fromMs, toMs, signatureOnly]);

  const filteredForDisplay = React.useMemo(() => {
    const list = filteredBase.filter((r) => {
      if (!failOnly) return true;
      const vr = verifyById[r.id];
      if (!vr) return false;
      return !(vr.checksumOk && vr.prevOk);
    });

    if (!pinFailToTop) return list;

    // Keep overall "newest first" order within each bucket (all is already newest-first)
    const bad: AuditRecord[] = [];
    const good: AuditRecord[] = [];
    for (const r of list) {
      const vr = verifyById[r.id];
      const isBad = vr ? !(vr.checksumOk && vr.prevOk) : false;
      (isBad ? bad : good).push(r);
    }
    return [...bad, ...good];
  }, [filteredBase, failOnly, pinFailToTop, verifyById]);

  const filteredForExport = React.useMemo(() => {
    // Exports should be chronologically ordered for compliance friendliness.
    // Use the same filters, including failOnly, but do NOT pin fail-to-top.
    const list = filteredBase.filter((r) => {
      if (!failOnly) return true;
      const vr = verifyById[r.id];
      if (!vr) return false;
      return !(vr.checksumOk && vr.prevOk);
    });
    return list.slice().reverse(); // oldest first
  }, [filteredBase, failOnly, verifyById]);

  const breachSummary = React.useMemo(() => {
    const allVerify = Object.values(verifyById);
    const fails = allVerify.filter((v) => !(v.checksumOk && v.prevOk));
    if (fails.length === 0) return null;
    // chain indices are chronological; pick earliest broken index
    const first = fails.slice().sort((a, b) => a.index - b.index)[0]!;
    return {
      failCount: fails.length,
      firstBrokenIndex: first.index,
      firstBrokenUtc: first.timestampUtc,
      firstBrokenId: first.id
    };
  }, [verifyById]);

  const exportCsv = () => {
    const csv = buildCsv(filteredForExport);
    downloadBlob(`manpasik-audit-report-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`, csv, "text/csv;charset=utf-8");
  };

  const exportPdf = () => {
    const fromUtc = fromMs !== null ? new Date(fromMs).toISOString() : "";
    const toUtc = toMs !== null ? new Date(toMs).toISOString() : "";
    const html = buildPrintableHtml({
      generatedAtUtc: new Date().toISOString(),
      verify,
      filters: { userId, action, recordType, query, fromUtc, toUtc, signatureOnly },
      records: filteredForExport
    });
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    // Let user choose "Save as PDF" in print dialog
    setTimeout(() => w.print(), 250);
  };

  const integrityBadge =
    verify.status === "ok" ? (
      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]">
        <ShieldCheck className="w-3 h-3 mr-1" /> Integrity OK
      </Badge>
    ) : verify.status === "error" ? (
      <Badge className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px]">
        <ShieldAlert className="w-3 h-3 mr-1" /> Breach Detected
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-[10px]">
        Checking…
      </Badge>
    );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <Card className="border shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600" />
                  감사 로그 리포트 (21 CFR Part 11)
                  {integrityBadge}
                </CardTitle>
                <CardDescription>
                  Append-only Audit Trail · Electronic Signature · SHA-256 Chain Verification
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={refresh} disabled={verify.status === "checking"}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침/검증
                </Button>
                <Button variant="outline" onClick={exportCsv} disabled={filteredForExport.length === 0}>
                  <FileDown className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button onClick={exportPdf} disabled={filteredForExport.length === 0}>
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            <Separator className="mt-3" />

            {/* Breach Summary */}
            {breachSummary && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-rose-900">
                    <ShieldAlert className="w-4 h-4" />
                    Breach Summary
                  </div>
                  <Badge className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px]">
                    FAIL {breachSummary.failCount}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border bg-white/70 p-2">
                    <div className="text-[11px] font-semibold text-rose-900">첫 실패 인덱스</div>
                    <div className="font-mono text-rose-900">#{breachSummary.firstBrokenIndex}</div>
                  </div>
                  <div className="rounded-lg border bg-white/70 p-2">
                    <div className="text-[11px] font-semibold text-rose-900">첫 실패 시간(UTC)</div>
                    <div className="font-mono text-rose-900 break-all">{breachSummary.firstBrokenUtc}</div>
                  </div>
                  <div className="rounded-lg border bg-white/70 p-2">
                    <div className="text-[11px] font-semibold text-rose-900">Record ID</div>
                    <div className="font-mono text-rose-900 break-all">{breachSummary.firstBrokenId}</div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-rose-800">
                  * FAIL 행은 “FAIL 상단 고정” 옵션으로 위에 표시되며, 상세에서 expected/actual을 확인할 수 있습니다.
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-1">
                <div className="text-xs font-medium flex items-center gap-1 mb-1">
                  <Filter className="w-3 h-3" /> 사용자
                </div>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                >
                  <option value="">전체</option>
                  {users.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <div className="text-xs font-medium mb-1">액션</div>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                >
                  <option value="">전체</option>
                  <option value="CREATE">CREATE</option>
                  <option value="READ">READ</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <div className="text-xs font-medium mb-1">레코드 타입</div>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                >
                  <option value="">전체</option>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <div className="text-xs font-medium mb-1">검색</div>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="reason / id / checksum…" />
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-1">
                <div className="text-xs font-medium mb-1">From (UTC)</div>
                <Input
                  type="datetime-local"
                  value={fromMs !== null ? new Date(fromMs).toISOString().slice(0, 16) : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return setFromMs(null);
                    // interpret input as UTC (not local)
                    const [datePart, timePart] = v.split("T");
                    const [yy, mm, dd] = datePart.split("-").map(Number);
                    const [hh, mi] = timePart.split(":").map(Number);
                    setFromMs(Date.UTC(yy, mm - 1, dd, hh, mi, 0));
                  }}
                />
              </div>
              <div className="md:col-span-1">
                <div className="text-xs font-medium mb-1">To (UTC)</div>
                <Input
                  type="datetime-local"
                  value={toMs !== null ? new Date(toMs).toISOString().slice(0, 16) : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return setToMs(null);
                    const [datePart, timePart] = v.split("T");
                    const [yy, mm, dd] = datePart.split("-").map(Number);
                    const [hh, mi] = timePart.split(":").map(Number);
                    setToMs(Date.UTC(yy, mm - 1, dd, hh, mi, 0));
                  }}
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm w-full">
                  <input
                    type="checkbox"
                    checked={signatureOnly}
                    onChange={(e) => setSignatureOnly(e.target.checked)}
                  />
                  <span className="text-sm">서명 포함만</span>
                </label>
              </div>
              <div className="md:col-span-1 flex items-end gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFromMs(null);
                    setToMs(null);
                    setSignatureOnly(false);
                    setFailOnly(false);
                    setPinFailToTop(true);
                    setQuery("");
                    setUserId("");
                    setAction("");
                    setRecordType("");
                    setExpandedId(null);
                  }}
                >
                  필터 초기화
                </Button>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-1 flex items-end">
                <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm w-full">
                  <input
                    type="checkbox"
                    checked={failOnly}
                    onChange={(e) => setFailOnly(e.target.checked)}
                  />
                  <span className="text-sm">FAIL만 보기</span>
                </label>
              </div>
              <div className="md:col-span-1 flex items-end">
                <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm w-full">
                  <input
                    type="checkbox"
                    checked={pinFailToTop}
                    onChange={(e) => setPinFailToTop(e.target.checked)}
                    disabled={failOnly}
                  />
                  <span className="text-sm">FAIL 상단 고정</span>
                </label>
              </div>
              <div className="md:col-span-2 text-xs text-muted-foreground flex items-end">
                * “FAIL 상단 고정”은 화면 표시 정렬만 변경합니다. CSV/PDF는 시간순(UTC)으로 출력합니다.
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              표시: <b>{filteredForDisplay.length}</b>건 (전체 {all.length}건) ·
              {verify.status === "ok" ? ` ${verify.message}` : verify.status === "error" ? ` ${verify.message}` : ""}
            </div>
          </CardHeader>

          <CardContent className="pb-4">
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left">
                    <th className="p-2 text-xs font-semibold w-[34px]"></th>
                    <th className="p-2 text-xs font-semibold">Integrity</th>
                    <th className="p-2 text-xs font-semibold">UTC</th>
                    <th className="p-2 text-xs font-semibold">User</th>
                    <th className="p-2 text-xs font-semibold">Action</th>
                    <th className="p-2 text-xs font-semibold">Type</th>
                    <th className="p-2 text-xs font-semibold">Record ID</th>
                    <th className="p-2 text-xs font-semibold">Reason</th>
                    <th className="p-2 text-xs font-semibold">E‑Sign</th>
                    <th className="p-2 text-xs font-semibold">Checksum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForDisplay.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-sm text-muted-foreground">
                        표시할 로그가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredForDisplay.map((r) => {
                      const expanded = expandedId === r.id;
                      const vr = verifyById[r.id];
                      const checksumOk = vr ? vr.checksumOk : true;
                      const prevOk = vr ? vr.prevOk : true;
                      const isBad = !(checksumOk && prevOk);
                      return (
                        <React.Fragment key={r.id}>
                          <tr
                            className={[
                              "border-t hover:bg-muted/20",
                              isBad ? "bg-rose-50/60" : ""
                            ].join(" ")}
                          >
                            <td className="p-2 text-xs">
                              <button
                                className="rounded p-1 hover:bg-muted"
                                onClick={() => setExpandedId((cur) => (cur === r.id ? null : r.id))}
                                aria-label="Toggle details"
                              >
                                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="p-2 text-xs whitespace-nowrap">
                              {isBad ? (
                                <Badge className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px]">
                                  FAIL
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]">
                                  OK
                                </Badge>
                              )}
                            </td>
                            <td className="p-2 text-xs whitespace-nowrap">{r.timestampUtc}</td>
                            <td className="p-2 text-xs whitespace-nowrap">{r.userId}</td>
                            <td className="p-2 text-xs whitespace-nowrap">
                              <Badge variant="secondary" className="text-[10px]">
                                {r.actionType}
                              </Badge>
                            </td>
                            <td className="p-2 text-xs whitespace-nowrap">{r.recordType ?? "-"}</td>
                            <td className="p-2 text-xs whitespace-nowrap">{r.recordId ?? "-"}</td>
                            <td className="p-2 text-xs max-w-[420px] truncate" title={r.reason ?? ""}>
                              {r.reason ?? "-"}
                            </td>
                            <td className="p-2 text-xs whitespace-nowrap">
                              {r.signature ? (
                                <Badge className="bg-sky-100 text-sky-800 border border-sky-200 text-[10px]">
                                  YES
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-2 text-xs whitespace-nowrap font-mono">
                              <span className={isBad ? "text-rose-700" : ""}>
                                {shortHash(r.checksum, 12)}
                              </span>
                            </td>
                          </tr>

                          {expanded && (
                            <tr className="border-t bg-muted/10">
                              <td colSpan={10} className="p-3">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  <Badge
                                    className={
                                      checksumOk
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]"
                                        : "bg-rose-100 text-rose-800 border border-rose-200 text-[10px]"
                                    }
                                  >
                                    checksum {checksumOk ? "OK" : "FAIL"}
                                  </Badge>
                                  <Badge
                                    className={
                                      prevOk
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]"
                                        : "bg-rose-100 text-rose-800 border border-rose-200 text-[10px]"
                                    }
                                  >
                                    prevChecksum {prevOk ? "OK" : "FAIL"}
                                  </Badge>
                                  {!checksumOk || !prevOk ? (
                                    <div className="text-xs text-rose-700">
                                      이 레코드는 체인 검증 실패로 표시됩니다.
                                    </div>
                                  ) : null}
                                </div>

                                {vr && (!checksumOk || !prevOk) ? (
                                  <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                    <div className="rounded-lg border bg-white p-2">
                                      <div className="font-semibold">Expected checksum</div>
                                      <div className="font-mono break-all">{vr.expectedChecksum}</div>
                                    </div>
                                    <div className="rounded-lg border bg-white p-2">
                                      <div className="font-semibold">Actual checksum</div>
                                      <div className="font-mono break-all">{vr.actualChecksum}</div>
                                    </div>
                                    <div className="rounded-lg border bg-white p-2">
                                      <div className="font-semibold">Expected prevChecksum</div>
                                      <div className="font-mono break-all">{vr.expectedPrevChecksum}</div>
                                    </div>
                                    <div className="rounded-lg border bg-white p-2">
                                      <div className="font-semibold">Actual prevChecksum</div>
                                      <div className="font-mono break-all">{vr.actualPrevChecksum}</div>
                                    </div>
                                  </div>
                                ) : null}

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                  <div className="lg:col-span-2">
                                    <div className="text-xs font-semibold mb-1">Audit Record (raw)</div>
                                    <pre className="text-[11px] rounded-lg border bg-white p-3 overflow-auto max-h-[320px]">
                                      {safeJson(r)}
                                    </pre>
                                  </div>
                                  <div className="lg:col-span-1 space-y-3">
                                    <div>
                                      <div className="text-xs font-semibold mb-1">Old Value</div>
                                      <pre className="text-[11px] rounded-lg border bg-white p-3 overflow-auto max-h-[150px]">
                                        {safeJson(r.oldVal)}
                                      </pre>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold mb-1">New Value</div>
                                      <pre className="text-[11px] rounded-lg border bg-white p-3 overflow-auto max-h-[150px]">
                                        {safeJson(r.newVal)}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


