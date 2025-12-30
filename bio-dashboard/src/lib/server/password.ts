import "server-only";

import crypto from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;

export type PasswordHash = {
  scheme: "scrypt";
  saltB64: string;
  hashB64: string;
};

export function hashPassword(password: string): PasswordHash {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  });
  return {
    scheme: "scrypt",
    saltB64: salt.toString("base64"),
    hashB64: Buffer.from(derived).toString("base64")
  };
}

export function verifyPassword(password: string, stored: PasswordHash): boolean {
  if (stored.scheme !== "scrypt") return false;
  const salt = Buffer.from(stored.saltB64, "base64");
  const expected = Buffer.from(stored.hashB64, "base64");
  const actual = crypto.scryptSync(password, salt, expected.length, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  });
  return crypto.timingSafeEqual(expected, Buffer.from(actual));
}







