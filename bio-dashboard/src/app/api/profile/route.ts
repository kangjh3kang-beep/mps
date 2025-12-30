import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { ensureProfile, getProfile, upsertProfile } from "@/lib/server/profile-db";
import type { UserProfile } from "@/lib/profile";

function requireUserId(session: any): string | null {
  const id = session?.user?.id;
  return typeof id === "string" ? id : null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await ensureProfile(userId);
  return NextResponse.json({ profile });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Partial update
  const schema = z.object({
    age: z.number().int().min(0).max(120).nullable().optional(),
    gender: z.enum(["female", "male", "other"]).nullable().optional(),
    heightCm: z.number().min(0).max(250).nullable().optional(),
    weightKg: z.number().min(0).max(300).nullable().optional(),
    chronicDiseases: z.array(z.enum(["diabetes", "hypertension", "ckd", "heart_failure", "cad"])).optional(),
    medications: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    smoking: z.enum(["never", "former", "current"]).nullable().optional(),
    drinking: z.enum(["none", "social", "regular"]).nullable().optional(),
    exercisePerWeek: z.number().int().min(0).max(14).nullable().optional(),
    sleepHours: z.number().min(0).max(24).nullable().optional(),
    goals: z.array(z.enum(["muscle_gain", "blood_sugar_control", "stress_management"])).optional(),
    completed: z.boolean().optional()
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await ensureProfile(userId);
  const next: UserProfile = {
    ...existing,
    ...parsed.data,
    userId,
    updatedAtUtc: new Date().toISOString()
  };

  await upsertProfile(next);
  return NextResponse.json({ ok: true, profile: next });
}







