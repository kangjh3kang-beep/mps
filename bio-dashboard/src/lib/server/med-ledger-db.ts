import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { IntakeRecord, MedLedgerEntry } from "@/lib/med-ledger";

type UserBucket = {
  entries: MedLedgerEntry[];
  intakes: Record<string, IntakeRecord>; // intakeKey -> record
};

type Db = {
  version: 1;
  updatedAtUtc: string;
  users: Record<string, UserBucket>;
};

function dbPath() {
  return path.join(process.cwd(), ".data", "med-ledger.json");
}

async function ensureDir() {
  await fs.mkdir(path.dirname(dbPath()), { recursive: true });
}

async function readDb(): Promise<Db> {
  await ensureDir();
  try {
    const raw = await fs.readFile(dbPath(), "utf8");
    const parsed = JSON.parse(raw) as Db;
    if (!parsed || parsed.version !== 1 || typeof parsed.users !== "object") throw new Error("bad");
    return parsed;
  } catch {
    return { version: 1, updatedAtUtc: new Date().toISOString(), users: {} };
  }
}

async function writeDb(db: Db) {
  await ensureDir();
  const next: Db = { ...db, updatedAtUtc: new Date().toISOString() };
  await fs.writeFile(dbPath(), JSON.stringify(next, null, 2), "utf8");
}

function bucket(db: Db, userId: string): UserBucket {
  if (!db.users[userId]) db.users[userId] = { entries: [], intakes: {} };
  return db.users[userId]!;
}

export async function listEntries(userId: string): Promise<MedLedgerEntry[]> {
  const db = await readDb();
  return bucket(db, userId).entries;
}

export async function getIntakes(userId: string): Promise<Record<string, IntakeRecord>> {
  const db = await readDb();
  return bucket(db, userId).intakes;
}

export async function addEntry(userId: string, entry: MedLedgerEntry) {
  const db = await readDb();
  const b = bucket(db, userId);
  b.entries = [entry, ...b.entries];
  db.users[userId] = b;
  await writeDb(db);
}

export async function updateEntry(userId: string, entryId: string, patch: Partial<MedLedgerEntry>) {
  const db = await readDb();
  const b = bucket(db, userId);
  const idx = b.entries.findIndex((e) => e.id === entryId);
  if (idx < 0) throw new Error("NOT_FOUND");
  b.entries[idx] = { ...b.entries[idx], ...patch, updatedAtUtc: new Date().toISOString() };
  db.users[userId] = b;
  await writeDb(db);
  return b.entries[idx];
}

export async function deleteEntry(userId: string, entryId: string) {
  const db = await readDb();
  const b = bucket(db, userId);
  b.entries = b.entries.filter((e) => e.id !== entryId);
  // Also remove intakes for this entry
  const nextIntakes: Record<string, IntakeRecord> = {};
  for (const [k, v] of Object.entries(b.intakes)) {
    if (!k.startsWith(`${entryId}|`)) nextIntakes[k] = v;
  }
  b.intakes = nextIntakes;
  db.users[userId] = b;
  await writeDb(db);
}

export async function markTaken(userId: string, intakeKey: string, record: IntakeRecord) {
  const db = await readDb();
  const b = bucket(db, userId);
  b.intakes[intakeKey] = record;
  db.users[userId] = b;
  await writeDb(db);
}







