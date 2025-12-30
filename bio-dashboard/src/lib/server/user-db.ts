import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { PasswordHash } from "@/lib/server/password";

export type DbUser = {
  id: string;
  email: string;
  createdAtUtc: string;
  passwordHash?: PasswordHash; // absent for pure OAuth users
  providers?: string[]; // e.g., ["credentials","google"]
  mfa: {
    enabled: boolean;
    secretB32?: string;
  };
};

type UserDb = {
  version: 1;
  updatedAtUtc: string;
  users: Record<string, DbUser>; // by id
  emailIndex: Record<string, string>; // email -> id
};

function dbPath() {
  return path.join(process.cwd(), ".data", "users.json");
}

async function ensureDir() {
  await fs.mkdir(path.dirname(dbPath()), { recursive: true });
}

async function readDb(): Promise<UserDb> {
  await ensureDir();
  try {
    const raw = await fs.readFile(dbPath(), "utf8");
    const parsed = JSON.parse(raw) as UserDb;
    if (!parsed || parsed.version !== 1) throw new Error("bad");
    return parsed;
  } catch {
    return {
      version: 1,
      updatedAtUtc: new Date().toISOString(),
      users: {},
      emailIndex: {}
    };
  }
}

async function writeDb(db: UserDb) {
  await ensureDir();
  const next: UserDb = { ...db, updatedAtUtc: new Date().toISOString() };
  await fs.writeFile(dbPath(), JSON.stringify(next, null, 2), "utf8");
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const db = await readDb();
  const key = email.trim().toLowerCase();
  const id = db.emailIndex[key];
  if (!id) return null;
  return db.users[id] ?? null;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const db = await readDb();
  return db.users[id] ?? null;
}

export async function createUser(args: {
  email: string;
  passwordHash?: PasswordHash;
  provider?: string;
}): Promise<DbUser> {
  const email = args.email.trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

  const db = await readDb();
  const id = `usr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user: DbUser = {
    id,
    email,
    createdAtUtc: new Date().toISOString(),
    passwordHash: args.passwordHash,
    providers: args.provider ? [args.provider] : ["credentials"],
    mfa: { enabled: false }
  };
  db.users[id] = user;
  db.emailIndex[email] = id;
  await writeDb(db);
  return user;
}

export async function upsertOAuthUser(args: { email: string; provider: string }): Promise<DbUser> {
  const email = args.email.trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) {
    const db = await readDb();
    const u = db.users[existing.id]!;
    const set = new Set([...(u.providers ?? []), args.provider]);
    u.providers = Array.from(set.values());
    db.users[u.id] = u;
    await writeDb(db);
    return u;
  }
  return await createUser({ email, provider: args.provider });
}

export async function setMfaSecret(userId: string, secretB32: string) {
  const db = await readDb();
  const u = db.users[userId];
  if (!u) throw new Error("NOT_FOUND");
  u.mfa.secretB32 = secretB32;
  u.mfa.enabled = true;
  db.users[userId] = u;
  await writeDb(db);
}

export async function disableMfa(userId: string) {
  const db = await readDb();
  const u = db.users[userId];
  if (!u) throw new Error("NOT_FOUND");
  u.mfa = { enabled: false };
  db.users[userId] = u;
  await writeDb(db);
}







