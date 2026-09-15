import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { getMessages, sendMessage, markConversationRead, isParticipant } from "@/lib/messaging";

export async function GET(_req: NextRequest, { params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return NextResponse.json({ messages: [] });

  if (!(await isParticipant(params.conversationId, session.githubId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const messages = await getMessages(params.conversationId).catch(() => []);
  void markConversationRead(params.conversationId, session.githubId);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  if (!(await isParticipant(params.conversationId, session.githubId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "body is required" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  try {
    const message = await sendMessage(params.conversationId, session.githubId, text);
    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
