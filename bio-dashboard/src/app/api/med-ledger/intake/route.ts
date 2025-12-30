import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { intakeKey, isValidTimeHHMM } from "@/lib/med-ledger";
import { markTaken } from "@/lib/server/med-ledger-db";

function requireUserId(session: any): string | null {
  const id = session?.user?.id;
  return typeof id === "string" ? id : null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z
    .object({
      entryId: z.string().min(1),
      date: z.string().min(8), // YYYY-MM-DD
      time: z.string().min(4),
      amount: z.number().optional()
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (!isValidTimeHHMM(parsed.data.time)) return NextResponse.json({ error: "Invalid time" }, { status: 400 });

  const key = intakeKey(parsed.data.entryId, parsed.data.date, parsed.data.time);
  await markTaken(userId, key, { takenAtUtc: new Date().toISOString(), amount: parsed.data.amount });

  return NextResponse.json({ ok: true, key });
}







