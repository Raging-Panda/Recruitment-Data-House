import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { acceptConversation, declineConversation } from "@/lib/messaging";

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
  }

  try {
    if (action === "accept") {
      await acceptConversation(params.conversationId, session.githubId);
    } else {
      await declineConversation(params.conversationId, session.githubId);
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
