/**
 * Privacy Guard Engine (HIPAA/GDPR - demo-grade)
 *
 * - De-identification pipeline: anonymizePayload(userData)
 * - Consent Management System (CMS): UserConsents append-only table + enforcement helpers
 *
 * NOTE: localStorage 기반 데모이며, 서버/DB 기반 불변성은 별도 구현 필요.
 */

export type ConsentType = "Marketing" | "Research" | "Third-party";
export type ConsentStatus = "Granted" | "Revoked";

export interface UserConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  timestampUtc: string;
}

export interface LocationInput {
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

export interface UserDataPayload {
  name?: string;
  phone?: string;
  email?: string;
  birthDate?: string; // ISO date
  location?: LocationInput | string;
  // medical data should remain intact (we do not touch unknown keys except PII ones)
  [k: string]: unknown;
}

const LS_CONSENTS = "manpasik:userConsents:v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function utcNowIso() {
  return new Date().toISOString();
}

function stableStringify(value: unknown): string {
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
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  const { createHash } = await import("crypto");
  return createHash("sha256").update(Buffer.from(data)).digest("hex");
}

async function oneWayHashId(input: string): Promise<string> {
  const h = await sha256Hex(input);
  return `anon_${h.slice(0, 16)}`;
}

function fuzzGpsToCityLevel(loc: LocationInput): { city: string; country?: string } {
  // Heuristic: if city already provided, keep it.
  if (loc.city && typeof loc.city === "string") return { city: loc.city, country: loc.country };

  const lat = loc.lat ?? loc.latitude;
  const lon = loc.lon ?? loc.longitude;

  if (typeof lat === "number" && typeof lon === "number" && Number.isFinite(lat) && Number.isFinite(lon)) {
    // Round to 0.1 degrees (~11km) as "city-level" fuzz proxy.
    const rLat = Math.round(lat * 10) / 10;
    const rLon = Math.round(lon * 10) / 10;
    return { city: `City~(${rLat.toFixed(1)},${rLon.toFixed(1)})`, country: loc.country };
  }

  return { city: "Unknown" };
}

function birthDateToYear(birthDate?: string): string | undefined {
  if (!birthDate) return undefined;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) {
    // allow "YYYY-MM-DD" fallback
    const m = birthDate.match(/^(\d{4})/);
    return m ? m[1] : undefined;
  }
  return String(d.getUTCFullYear());
}

/**
 * De-identification pipeline.
 * - name/phone/email → one-way hash id
 * - location → city-level only
 * - birthDate → year only
 * - medical data (unknown keys like glucose/ecg) is kept as-is
 */
export async function anonymizePayload(userData: UserDataPayload): Promise<UserDataPayload> {
  const out: UserDataPayload = { ...userData };

  const piiSource = stableStringify({
    name: userData.name ?? "",
    phone: userData.phone ?? "",
    email: userData.email ?? ""
  });
  const anonId = await oneWayHashId(piiSource);

  if (userData.name !== undefined) out.name = anonId;
  if (userData.phone !== undefined) out.phone = anonId;
  if (userData.email !== undefined) out.email = anonId;

  if (userData.birthDate !== undefined) out.birthDate = birthDateToYear(userData.birthDate);

  if (userData.location !== undefined) {
    if (typeof userData.location === "string") {
      // cannot infer coordinates; keep coarse string only
      out.location = { city: userData.location };
    } else {
      out.location = fuzzGpsToCityLevel(userData.location);
    }
  }

  return out;
}

function loadConsentRecords(): UserConsentRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(LS_CONSENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserConsentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConsentRecords(records: UserConsentRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(LS_CONSENTS, JSON.stringify(records));
}

export const consentManager = {
  getAll(): UserConsentRecord[] {
    return loadConsentRecords();
  },

  getUserHistory(userId: string): UserConsentRecord[] {
    return loadConsentRecords().filter((r) => r.userId === userId).sort((a, b) => a.timestampUtc.localeCompare(b.timestampUtc));
  },

  getUserLatest(userId: string): Record<ConsentType, ConsentStatus> {
    const history = consentManager.getUserHistory(userId);
    const latest: Record<ConsentType, ConsentStatus> = {
      Marketing: "Revoked",
      Research: "Revoked",
      "Third-party": "Revoked"
    };
    for (const r of history) {
      latest[r.consentType] = r.status;
    }
    return latest;
  },

  isGranted(userId: string, type: ConsentType): boolean {
    const latest = consentManager.getUserLatest(userId);
    return latest[type] === "Granted";
  },

  set(
    userId: string,
    type: ConsentType,
    status: ConsentStatus,
    opts?: { timestampUtc?: string; id?: string }
  ): UserConsentRecord {
    const records = loadConsentRecords();
    const rec: UserConsentRecord = {
      id:
        opts?.id ??
        `CONS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      userId,
      consentType: type,
      status,
      timestampUtc: opts?.timestampUtc ?? utcNowIso()
    };
    // append-only
    const next = [...records, rec];
    saveConsentRecords(next);
    return rec;
  }
};

export default { anonymizePayload, consentManager };


