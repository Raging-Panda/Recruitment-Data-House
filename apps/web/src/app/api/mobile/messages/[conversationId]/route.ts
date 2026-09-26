import { NextRequest, NextResponse } from "next/server";
import { resolveMobileGithubId } from "@/lib/mobile-auth";
import {
  getMessages,
  sendMessageAndNotify,
  markConversationRead,
  isParticipant,
  getConversationMeta,
} from "@/lib/messaging";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDirectoryEntry } from "@/lib/directory";

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const githubId = await resolveMobileGithubId(req);
  if (!githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!(await isParticipant(params.conversationId, githubId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: convo } = await getSupabaseAdmin()
    .from("conversations")
    .select("participant_a, participant_b")
    .eq("id", params.conversationId)
    .maybeSingle();
  const otherId = convo?.participant_a === githubId ? convo?.participant_b : convo?.participant_a;

  const [messages, meta, other] = await Promise.all([
    getMessages(params.conversationId).catch(() => []),
    getConversationMeta(params.conversationId),
    otherId ? getDirectoryEntry(otherId).catch(() => null) : Promise.resolve(null),
  ]);
  void markConversationRead(params.conversationId, githubId);

  return NextResponse.json({
    messages,
    viewerId: githubId,
    status: meta?.status ?? "accepted",
    isPendingOnMe: meta?.status === "pending" && meta.pendingAcceptanceBy === githubId,
    otherName: other?.displayName ?? "A developer",
    otherAvatarUrl: other?.avatarUrl ?? null,
  });
}

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const githubId = await resolveMobileGithubId(req);
  if (!githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!(await isParticipant(params.conversationId, githubId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meta = await getConversationMeta(params.conversationId);
  if (meta?.status === "pending" && meta.pendingAcceptanceBy === githubId) {
    return NextResponse.json({ error: "Accept or decline this request first" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "body is required" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  try {
    const message = await sendMessageAndNotify(params.conversationId, githubId, text);
    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
