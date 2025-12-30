/**
 * Secure OTA (Over-The-Air) Firmware Update Simulation
 * IEC 62304 + FDA Cybersecurity Guidance inspired (demo-grade)
 *
 * - Verify firmware package signature (ECDSA P-256 / SHA-256) against manufacturer public key
 * - Block update if battery < 20%
 * - Log security incidents (audit trail)
 */

import { auditLogger } from "@/lib/audit-logger";

export type FirmwareUpdateResult =
  | { ok: true; message: string }
  | { ok: false; message: string; incidentCode: string };

export type FirmwarePackage = {
  version: string;
  downloadedAtUtc: string;
  /** firmware binary/data (base64 for simulation) */
  payloadBase64: string;
  /** signature over payload (base64 raw signature or DER; we use raw P-256 for demo) */
  signatureBase64: string;
  /** signature algorithm */
  alg: "ECDSA_P256_SHA256";
};

// Demo manufacturer public key (P-256) JWK.
// In production, ship via secure channel / pinned.
const MANUFACTURER_PUBLIC_KEY_JWK: JsonWebKey = {
  kty: "EC",
  crv: "P-256",
  // These are demo values (not secret). Replace with your real manufacturer key.
  // NOTE: verify will fail unless packages are signed with the matching private key.
  x: "f83OJ3D2xF4dKz4o7xK2w1mGQh2QwR4oGxYp9xD0dX8",
  y: "x_FEzRu9mRjE6t0YcJjvCw6bQxq3yU7b1lQvO3W4pN0",
  ext: true
};

function isBrowser() {
  return typeof window !== "undefined";
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function importManufacturerKey(): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto not available");
  }
  return await globalThis.crypto.subtle.importKey(
    "jwk",
    MANUFACTURER_PUBLIC_KEY_JWK,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
}

async function verifySignature(pkg: FirmwarePackage): Promise<boolean> {
  const key = await importManufacturerKey();
  const data = b64ToBytes(pkg.payloadBase64);
  const sig = b64ToBytes(pkg.signatureBase64);
  return await globalThis.crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, sig, data);
}

export async function getBatteryPct(): Promise<number | null> {
  if (!isBrowser()) return null;
  const nav = navigator as any;
  if (typeof nav.getBattery !== "function") return null;
  try {
    const battery = await nav.getBattery();
    const level = typeof battery.level === "number" ? battery.level : null;
    if (level === null) return null;
    return Math.round(level * 100);
  } catch {
    return null;
  }
}

export async function applyFirmwareUpdate(opts: {
  userId: string;
  deviceId: string;
  pkg: FirmwarePackage;
  /** optional battery override for simulation */
  batteryPctOverride?: number;
}): Promise<FirmwareUpdateResult> {
  const batteryPct = opts.batteryPctOverride ?? (await getBatteryPct()) ?? 100;

  // Battery gate
  if (batteryPct < 20) {
    const msg = `Update blocked: battery ${batteryPct}% < 20%`;
    await auditLogger.logAction(
      opts.userId,
      "UPDATE",
      null,
      { deviceId: opts.deviceId, version: opts.pkg.version, batteryPct },
      msg,
      { recordType: "SecurityIncident", recordId: `OTA:${opts.deviceId}:${opts.pkg.version}` }
    );
    return { ok: false, incidentCode: "OTA_BATTERY_LOW", message: msg };
  }

  // Signature verify
  try {
    const valid = await verifySignature(opts.pkg);
    if (!valid) {
      const msg = "Update rejected: digital signature verification failed";
      await auditLogger.logAction(
        opts.userId,
        "UPDATE",
        null,
        { deviceId: opts.deviceId, version: opts.pkg.version, batteryPct },
        msg,
        { recordType: "SecurityIncident", recordId: `OTA:${opts.deviceId}:${opts.pkg.version}` }
      );
      return { ok: false, incidentCode: "OTA_SIGNATURE_INVALID", message: msg };
    }
  } catch (e) {
    const msg = `Update rejected: signature verification error (${(e as Error).message})`;
    await auditLogger.logAction(
      opts.userId,
      "UPDATE",
      null,
      { deviceId: opts.deviceId, version: opts.pkg.version, batteryPct },
      msg,
      { recordType: "SecurityIncident", recordId: `OTA:${opts.deviceId}:${opts.pkg.version}` }
    );
    return { ok: false, incidentCode: "OTA_VERIFY_ERROR", message: msg };
  }

  // Apply update (simulation)
  await auditLogger.logAction(
    opts.userId,
    "UPDATE",
    null,
    { deviceId: opts.deviceId, version: opts.pkg.version, batteryPct, appliedAtUtc: new Date().toISOString() },
    "Firmware update applied (simulated)",
    { recordType: "FirmwareUpdate", recordId: `FW:${opts.deviceId}:${opts.pkg.version}`, dataRecord: opts.pkg }
  );

  return { ok: true, message: "Firmware update applied (simulated)" };
}







