import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { DeepAnalysisPacket } from "@/lib/deep-analysis";

type Db = {
  version: 1;
  updatedAtUtc: string;
  packets: Record<string, DeepAnalysisPacket>;
};

function dbPath() {
  // Stored under project working dir (bio-dashboard/), not git-tracked.
  return path.join(process.cwd(), ".data", "deep-packets.json");
}

async function ensureDir() {
  const dir = path.dirname(dbPath());
  await fs.mkdir(dir, { recursive: true });
}

async function readDb(): Promise<Db> {
  await ensureDir();
  try {
    const raw = await fs.readFile(dbPath(), "utf8");
    const parsed = JSON.parse(raw) as Db;
    if (!parsed || parsed.version !== 1 || typeof parsed.packets !== "object") {
      return { version: 1, updatedAtUtc: new Date().toISOString(), packets: {} };
    }
    return parsed;
  } catch {
    return { version: 1, updatedAtUtc: new Date().toISOString(), packets: {} };
  }
}

async function writeDb(db: Db) {
  await ensureDir();
  const next: Db = { ...db, updatedAtUtc: new Date().toISOString() };
  await fs.writeFile(dbPath(), JSON.stringify(next, null, 2), "utf8");
}

export async function putDeepPacket(packet: DeepAnalysisPacket) {
  const db = await readDb();
  db.packets[packet.id] = packet;
  await writeDb(db);
}

export async function getDeepPacket(id: string): Promise<DeepAnalysisPacket | null> {
  const db = await readDb();
  return db.packets[id] ?? null;
}







