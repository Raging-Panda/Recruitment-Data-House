import { NextRequest, NextResponse } from "next/server";
import { resolveMobileGithubId } from "@/lib/mobile-auth";
import { acceptConversation, declineConversation } from "@/lib/messaging";

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const githubId = await resolveMobileGithubId(req);
  if (!githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
  }

  try {
    if (action === "accept") {
      await acceptConversation(params.conversationId, githubId);
    } else {
      await declineConversation(params.conversationId, githubId);
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
