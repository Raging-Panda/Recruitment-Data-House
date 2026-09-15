import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { follow, unfollow } from "@/lib/social";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const targetId = typeof body?.targetId === "string" ? body.targetId : "";
  if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });

  try {
    await follow(session.githubId, targetId);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not follow" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const targetId = typeof body?.targetId === "string" ? body.targetId : "";
  if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });

  try {
    await unfollow(session.githubId, targetId);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not unfollow" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
