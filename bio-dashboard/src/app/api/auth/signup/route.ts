import { NextResponse } from "next/server";
import { z } from "zod";

import { createUser } from "@/lib/server/user-db";
import { hashPassword } from "@/lib/server/password";
import { ensureProfile } from "@/lib/server/profile-db";

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const user = await createUser({
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      provider: "credentials"
    });
    await ensureProfile(user.id);
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}







