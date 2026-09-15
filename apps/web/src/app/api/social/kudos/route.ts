import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { giveKudos, removeKudos } from "@/lib/social";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const eventId = typeof body?.eventId === "string" ? body.eventId : "";
  const remove = body?.remove === true;
  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

  try {
    if (remove) await removeKudos(session.githubId, eventId);
    else await giveKudos(session.githubId, eventId);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
