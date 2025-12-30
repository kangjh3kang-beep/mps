import { NextResponse } from "next/server";
import type { DeepAnalysisPacket } from "@/lib/deep-analysis";
import { generateReportPrompt, generateSimulatedReport, type UserProfile, type ReportContext } from "@/lib/reporting";
import { getDeepPacket, putDeepPacket } from "@/lib/server/deep-packet-db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureProfile } from "@/lib/server/profile-db";

type ReqBody = {
  userProfile?: UserProfile;
  deepPacketId?: string;
  /** optional fallback: if provided, server can cache it and then use id */
  deepPacket?: DeepAnalysisPacket;
  context?: ReportContext;
  /** optional: simulate RAG */
  mode?: "rag" | "llm";
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function isUserProfile(v: unknown): v is UserProfile {
  if (!isObj(v)) return false;
  const age = (v as any).age;
  const gender = (v as any).gender;
  const conditions = (v as any).conditions;
  const goals = (v as any).goals;
  return (
    typeof age === "number" &&
    Number.isFinite(age) &&
    (gender === "female" || gender === "male" || gender === "other") &&
    Array.isArray(conditions) &&
    conditions.every((c) => typeof c === "string") &&
    (goals === undefined || (Array.isArray(goals) && goals.every((g) => typeof g === "string")))
  );
}

function isDeepPacket(v: unknown): v is DeepAnalysisPacket {
  if (!isObj(v)) return false;
  return (
    typeof (v as any).id === "string" &&
    typeof (v as any).measurementId === "string" &&
    typeof (v as any).createdAtUtc === "string" &&
    isObj((v as any).layer1) &&
    isObj((v as any).layer2) &&
    isObj((v as any).layer3) &&
    isObj((v as any).layer4)
  );
}

export async function POST(req: Request) {
  let body: ReqBody | null = null;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Auto-inject goals/profile context from server-side profile DB (auth + MFA gated by middleware)
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await ensureProfile(userId);

  const derivedUserProfile: UserProfile = {
    age: typeof profile.age === "number" ? profile.age : 45,
    gender: profile.gender ?? "other",
    conditions: (profile.chronicDiseases ?? []).map((c) => String(c)),
    goals: profile.goals ?? []
  };

  const providedProfile = body.userProfile && isUserProfile(body.userProfile) ? body.userProfile : null;
  const effectiveUserProfile: UserProfile = {
    ...derivedUserProfile,
    ...providedProfile,
    // Always trust server profile goals if present
    goals: (profile.goals?.length ? profile.goals : providedProfile?.goals) ?? []
  };

  const effectiveContext: ReportContext = {
    ...(body.context ?? {}),
    medications:
      (body.context?.medications?.length ? body.context.medications : profile.medications ?? []).map((m) => String(m).toLowerCase())
  };

  let packet: DeepAnalysisPacket | null = null;
  const id = body.deepPacketId;
  if (id) {
    packet = await getDeepPacket(id);
  }
  if (!packet && body.deepPacket && isDeepPacket(body.deepPacket)) {
    packet = body.deepPacket;
    // best-effort cache for future id-only calls
    try {
      await putDeepPacket(packet);
    } catch {
      // ignore
    }
  }
  if (!packet) {
    return NextResponse.json({ error: "DeepAnalysisPacket not found", hint: "Upload via /api/deep-packet first" }, { status: 404 });
  }

  // "LLM" integration note:
  // - In production, call your provider here with `prompt` and optional retrieved references.
  // - For this repo demo, we simulate a RAG-like report locally on the server.
  const prompt = generateReportPrompt(effectiveUserProfile, packet, effectiveContext);
  const report = generateSimulatedReport({ userProfile: effectiveUserProfile, deepPacket: packet, context: effectiveContext });

  return NextResponse.json({
    source: body.mode ?? "rag",
    deepPacketId: packet.id,
    userGoals: effectiveUserProfile.goals ?? [],
    prompt,
    report
  });
}


