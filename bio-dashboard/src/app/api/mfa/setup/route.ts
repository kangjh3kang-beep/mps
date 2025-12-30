import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authenticator } from "otplib";

import { authOptions } from "@/lib/auth";
import { setMfaSecret } from "@/lib/server/user-db";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const email = session?.user?.email ?? undefined;
  if (!userId || !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = authenticator.generateSecret(); // base32
  const issuer = "Manpasik";
  const otpauth = authenticator.keyuri(email, issuer, secret);

  // Store secret + enable MFA
  await setMfaSecret(userId, secret);

  return NextResponse.json({ ok: true, secret, otpauth, issuer, label: email });
}







