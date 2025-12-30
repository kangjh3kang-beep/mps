/**
 * Audit Trail & Electronic Signature (FDA 21 CFR Part 11 - demo-grade)
 *
 * Goals (client-side simulation):
 * - Append-only audit log (no delete/modify APIs exposed)
 * - Tamper-evident integrity via SHA-256 checksum chain
 * - Optional electronic signature block cryptographically linked to a data record checksum
 *
 * NOTE: localStorage is not truly immutable; the checksum chain detects tampering on startup.
 */

export type AuditActionType = "CREATE" | "READ" | "UPDATE" | "DELETE";

export type ReAuthMethod = "password" | "biometric";

export interface ElectronicSignature {
  signerId: string;
  reAuthMethod: ReAuthMethod;
  meaning: string;
  signedAtUtc: string; // ISO
  /** SHA-256 over (dataChecksum + meaning + signerId + reAuthMethod + signedAtUtc) */
  signatureHash: string;
}

export interface AuditRecord {
  id: string;
  timestampUtc: string; // ISO
  userId: string;
  actionType: AuditActionType;

  recordType?: string;
  recordId?: string;

  oldVal?: unknown;
  newVal?: unknown;
  reason?: string;

  /** checksum of the *data record being signed* (or changed) */
  dataChecksum?: string;

  /** previous audit record checksum (chain) */
  prevChecksum: string;

  /** SHA-256 checksum of this audit record (excluding checksum itself) */
  checksum: string;

  signature?: ElectronicSignature;
}

export interface VerifyResult {
  ok: boolean;
  message: string;
  brokenAtIndex?: number;
  expectedChecksum?: string;
  actualChecksum?: string;
  expectedPrevChecksum?: string;
  actualPrevChecksum?: string;
  count: number;
}

export interface VerifyRecordResult {
  index: number;
  id: string;
  timestampUtc: string;
  checksumOk: boolean;
  prevOk: boolean;
  expectedChecksum: string;
  actualChecksum: string;
  expectedPrevChecksum: string;
  actualPrevChecksum: string;
}

export interface VerifyDetailedResult {
  ok: boolean;
  message: string;
  count: number;
  results: VerifyRecordResult[];
  brokenAtIndex?: number;
}

const LS_KEY = "manpasik:audit:v1";
const LS_LOCK_KEY = "manpasik:systemLocked";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function utcNowIso() {
  return new Date().toISOString();
}

function stableStringify(value: unknown): string {
  // stable stringify with sorted keys to ensure deterministic hashing
  const seen = new WeakSet<object>();

  const normalize = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(normalize);
    if (seen.has(v)) return "[Circular]";
    seen.add(v);
    const keys = Object.keys(v).sort();
    const out: Record<string, any> = {};
    for (const k of keys) out[k] = normalize(v[k]);
    return out;
  };

  return JSON.stringify(normalize(value));
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  // Browser WebCrypto
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Node.js fallback (for SSR / tests)
  const { createHash } = await import("crypto");
  return createHash("sha256").update(Buffer.from(data)).digest("hex");
}

function loadLog(): AuditRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLog(records: AuditRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(records));
}

function lockSystem(flag: boolean, reason?: string) {
  if (!isBrowser()) return;
  try {
    if (flag) window.localStorage.setItem(LS_LOCK_KEY, JSON.stringify({ locked: true, reason, ts: Date.now() }));
    else window.localStorage.removeItem(LS_LOCK_KEY);
  } catch {
    // ignore
  }
}

function getSystemLock(): { locked: boolean; reason?: string; ts?: number } {
  if (!isBrowser()) return { locked: false };
  try {
    const raw = window.localStorage.getItem(LS_LOCK_KEY);
    if (!raw) return { locked: false };
    const p = JSON.parse(raw) as any;
    if (p?.locked) return { locked: true, reason: p.reason, ts: p.ts };
    return { locked: false };
  } catch {
    return { locked: false };
  }
}

async function computeRecordChecksum(r: Omit<AuditRecord, "checksum">): Promise<string> {
  // checksum over all fields except checksum itself
  const payload = { ...r, checksum: undefined };
  return sha256Hex(stableStringify(payload));
}

export const auditLogger = {
  getSystemLock,
  lockSystem,

  getLog(): AuditRecord[] {
    return loadLog();
  },

  async checksumOfDataRecord(data: unknown): Promise<string> {
    return sha256Hex(stableStringify(data));
  },

  /**
   * Append-only audit log action.
   */
  async logAction(
    userId: string,
    actionType: AuditActionType,
    oldVal: unknown,
    newVal: unknown,
    reason?: string,
    opts?: {
      recordType?: string;
      recordId?: string;
      signature?: ElectronicSignature;
      dataRecord?: unknown; // if provided, we compute dataChecksum from it
    }
  ): Promise<AuditRecord> {
    const records = loadLog();
    const prevChecksum = records.length > 0 ? records[records.length - 1]!.checksum : "GENESIS";

    const timestampUtc = utcNowIso();
    const dataChecksum =
      opts?.dataRecord !== undefined ? await auditLogger.checksumOfDataRecord(opts.dataRecord) : undefined;

    const base: Omit<AuditRecord, "checksum"> = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      timestampUtc,
      userId,
      actionType,
      recordType: opts?.recordType,
      recordId: opts?.recordId,
      oldVal,
      newVal,
      reason,
      dataChecksum,
      prevChecksum,
      signature: opts?.signature
    };

    const checksum = await computeRecordChecksum(base);
    const record: AuditRecord = { ...base, checksum };

    const next = [...records, record];
    saveLog(next);
    return record;
  },

  /**
   * Verify audit checksum chain; if tampered, returns failure.
   */
  async verifyChain(): Promise<VerifyResult> {
    const records = loadLog();
    if (records.length === 0) {
      return { ok: true, message: "Empty audit log", count: 0 };
    }

    let prev = "GENESIS";
    for (let i = 0; i < records.length; i++) {
      const r = records[i]!;

      if (r.prevChecksum !== prev) {
        return {
          ok: false,
          message: `Data Integrity Breach: prevChecksum mismatch at #${i}`,
          brokenAtIndex: i,
          expectedPrevChecksum: prev,
          actualPrevChecksum: r.prevChecksum,
          count: records.length
        };
      }

      const expected = await computeRecordChecksum({ ...r, checksum: undefined } as any);
      if (expected !== r.checksum) {
        return {
          ok: false,
          message: `Data Integrity Breach: checksum mismatch at #${i}`,
          brokenAtIndex: i,
          expectedChecksum: expected,
          actualChecksum: r.checksum,
          count: records.length
        };
      }

      prev = r.checksum;
    }

    return { ok: true, message: `Audit chain verified: ${records.length} records`, count: records.length };
  },

  /**
   * Verify chain and return per-record results (for UI inspection).
   * Results are in chronological order (oldest -> newest).
   */
  async verifyChainDetailed(): Promise<VerifyDetailedResult> {
    const records = loadLog();
    const results: VerifyRecordResult[] = [];
    if (records.length === 0) {
      return { ok: true, message: "Empty audit log", count: 0, results: [] };
    }

    let prev = "GENESIS";
    let brokenAtIndex: number | undefined;

    for (let i = 0; i < records.length; i++) {
      const r = records[i]!;
      const expectedPrevChecksum = prev;
      const prevOk = r.prevChecksum === expectedPrevChecksum;

      const expectedChecksum = await computeRecordChecksum({ ...r, checksum: undefined } as any);
      const checksumOk = expectedChecksum === r.checksum;

      results.push({
        index: i,
        id: r.id,
        timestampUtc: r.timestampUtc,
        checksumOk,
        prevOk,
        expectedChecksum,
        actualChecksum: r.checksum,
        expectedPrevChecksum,
        actualPrevChecksum: r.prevChecksum
      });

      if (brokenAtIndex === undefined && (!prevOk || !checksumOk)) brokenAtIndex = i;
      prev = r.checksum;
    }

    const ok = brokenAtIndex === undefined;
    return {
      ok,
      message: ok ? `Audit chain verified: ${records.length} records` : `Data Integrity Breach at #${brokenAtIndex}`,
      count: records.length,
      results,
      brokenAtIndex
    };
  },

  /**
   * Convenience: create an electronic signature hash linked to a data checksum.
   */
  async createElectronicSignature(args: {
    signerId: string;
    reAuthMethod: ReAuthMethod;
    meaning: string;
    dataChecksum: string;
  }): Promise<ElectronicSignature> {
    const signedAtUtc = utcNowIso();
    const signatureHash = await sha256Hex(
      stableStringify({
        signerId: args.signerId,
        reAuthMethod: args.reAuthMethod,
        meaning: args.meaning,
        signedAtUtc,
        dataChecksum: args.dataChecksum
      })
    );
    return {
      signerId: args.signerId,
      reAuthMethod: args.reAuthMethod,
      meaning: args.meaning,
      signedAtUtc,
      signatureHash
    };
  }
};

export default auditLogger;


