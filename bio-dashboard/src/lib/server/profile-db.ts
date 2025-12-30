import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { UserProfile } from "@/lib/profile";

type ProfileDb = {
  version: 1;
  updatedAtUtc: string;
  profiles: Record<string, UserProfile>; // by userId
};

function dbPath() {
  return path.join(process.cwd(), ".data", "profiles.json");
}

async function ensureDir() {
  await fs.mkdir(path.dirname(dbPath()), { recursive: true });
}

async function readDb(): Promise<ProfileDb> {
  await ensureDir();
  try {
    const raw = await fs.readFile(dbPath(), "utf8");
    const parsed = JSON.parse(raw) as ProfileDb;
    if (!parsed || parsed.version !== 1) throw new Error("bad");
    return parsed;
  } catch {
    return { version: 1, updatedAtUtc: new Date().toISOString(), profiles: {} };
  }
}

async function writeDb(db: ProfileDb) {
  await ensureDir();
  const next: ProfileDb = { ...db, updatedAtUtc: new Date().toISOString() };
  await fs.writeFile(dbPath(), JSON.stringify(next, null, 2), "utf8");
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const db = await readDb();
  return db.profiles[userId] ?? null;
}

export async function upsertProfile(profile: UserProfile): Promise<UserProfile> {
  const db = await readDb();
  db.profiles[profile.userId] = profile;
  await writeDb(db);
  return profile;
}

export async function ensureProfile(userId: string): Promise<UserProfile> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const fresh: UserProfile = {
    userId,
    createdAtUtc: now,
    updatedAtUtc: now,
    age: null,
    gender: null,
    heightCm: null,
    weightKg: null,
    chronicDiseases: [],
    medications: [],
    allergies: [],
    smoking: null,
    drinking: null,
    exercisePerWeek: null,
    sleepHours: null,
    goals: [],
    completed: false
  };
  return await upsertProfile(fresh);
}







