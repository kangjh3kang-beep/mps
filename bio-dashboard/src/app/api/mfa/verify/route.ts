import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authenticator } from "otplib";

import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/server/user-db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z.object({ code: z.string().min(6).max(8) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await getUserById(userId);
  const secret = user?.mfa.secretB32;
  if (!user?.mfa.enabled || !secret) {
    return NextResponse.json({ error: "MFA not enabled" }, { status: 400 });
  }

  const ok = authenticator.verify({ token: parsed.data.code.replace(/\s/g, ""), secret });
  if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  return NextResponse.json({ ok: true });
}







