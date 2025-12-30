import { NextResponse } from "next/server";
import type { DeepAnalysisPacket } from "@/lib/deep-analysis";
import { getDeepPacket, putDeepPacket } from "@/lib/server/deep-packet-db";

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const packet = await getDeepPacket(id);
  if (!packet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ packet });
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const packet = body?.packet;
  if (!isDeepPacket(packet)) return NextResponse.json({ error: "Invalid packet" }, { status: 400 });

  await putDeepPacket(packet);
  return NextResponse.json({ ok: true, id: packet.id });
}







