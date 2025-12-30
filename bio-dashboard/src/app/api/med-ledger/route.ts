import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { addEntry, deleteEntry, getIntakes, listEntries, updateEntry } from "@/lib/server/med-ledger-db";
import { normalizeTimes } from "@/lib/med-ledger";
import type { MedLedgerEntry } from "@/lib/med-ledger";

function requireUserId(session: any): string | null {
  const id = session?.user?.id;
  return typeof id === "string" ? id : null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await listEntries(userId);
  const intakes = await getIntakes(userId);
  return NextResponse.json({ entries, intakes });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schema = z.object({
    name: z.string().min(1).max(80),
    category: z.enum(["medicine", "supplement"]),
    doseAmount: z.number().positive(),
    doseUnit: z.string().min(1).max(20),
    scheduleTimes: z.array(z.string()).min(1),
    notes: z.string().max(200).optional().nullable(),
    active: z.boolean().optional()
  });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const now = new Date().toISOString();
  const entry: MedLedgerEntry = {
    id: `med_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name: parsed.data.name.trim(),
    category: parsed.data.category,
    dose: { amount: parsed.data.doseAmount, unit: parsed.data.doseUnit.trim() },
    scheduleTimes: normalizeTimes(parsed.data.scheduleTimes),
    notes: parsed.data.notes ?? undefined,
    active: parsed.data.active ?? true,
    createdAtUtc: now,
    updatedAtUtc: now
  };

  await addEntry(userId, entry);
  return NextResponse.json({ ok: true, entry });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schema = z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(80).optional(),
    category: z.enum(["medicine", "supplement"]).optional(),
    doseAmount: z.number().positive().optional(),
    doseUnit: z.string().min(1).max(20).optional(),
    scheduleTimes: z.array(z.string()).optional(),
    notes: z.string().max(200).optional().nullable(),
    active: z.boolean().optional()
  });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const patch: Partial<MedLedgerEntry> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name.trim();
  if (parsed.data.category !== undefined) patch.category = parsed.data.category;
  if (parsed.data.doseAmount !== undefined || parsed.data.doseUnit !== undefined) {
    patch.dose = {
      amount: parsed.data.doseAmount ?? 1,
      unit: (parsed.data.doseUnit ?? "unit").trim()
    };
  }
  if (parsed.data.scheduleTimes !== undefined) patch.scheduleTimes = normalizeTimes(parsed.data.scheduleTimes);
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes ?? undefined;
  if (parsed.data.active !== undefined) patch.active = parsed.data.active;

  try {
    const updated = await updateEntry(userId, parsed.data.id, patch);
    return NextResponse.json({ ok: true, entry: updated });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await deleteEntry(userId, id);
  return NextResponse.json({ ok: true });
}







