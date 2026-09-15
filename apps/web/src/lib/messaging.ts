import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getMessagePreference } from "@/lib/message-preference";

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export interface ConversationMeta {
  id: string;
  status: "pending" | "accepted";
  pendingAcceptanceBy: string | null;
}

/**
 * `me` is whoever is initiating (message-button clicker); `them` is the
 * recipient, whose message_preference decides whether this starts
 * "accepted" (open) or "pending" (requires their accept/decline) — see
 * lib/message-preference.ts and the "Direct Messages" Settings card.
 */
export async function getOrCreateConversation(me: string, them: string): Promise<ConversationMeta> {
  if (me === them) throw new Error("Can't message yourself");
  const [participantA, participantB] = canonicalPair(me, them);
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id, status, pending_acceptance_by")
    .eq("participant_a", participantA)
    .eq("participant_b", participantB)
    .maybeSingle();
  if (existing) {
    return {
      id: existing.id,
      status: (existing.status as "pending" | "accepted") ?? "accepted",
      pendingAcceptanceBy: existing.pending_acceptance_by ?? null,
    };
  }

  const theirPreference = await getMessagePreference(them);
  const status = theirPreference === "request" ? "pending" : "accepted";
  const pendingAcceptanceBy = status === "pending" ? them : null;

  // Same lesson as directory.ts's sync fix: try the full row (status /
  // pending_acceptance_by included) first so this starts working the
  // moment migration 0005 lands; fall back to a plain accepted
  // conversation (pre-migration behavior) rather than failing the whole
  // insert over two unknown columns.
  const { data, error } = await supabase
    .from("conversations")
    .insert({ participant_a: participantA, participant_b: participantB, status, pending_acceptance_by: pendingAcceptanceBy })
    .select("id, status, pending_acceptance_by")
    .single();

  if (error?.code === "PGRST204") {
    const fallback = await supabase
      .from("conversations")
      .insert({ participant_a: participantA, participant_b: participantB })
      .select("id")
      .single();
    if (fallback.error) throw new Error(fallback.error.message);
    return { id: fallback.data.id, status: "accepted", pendingAcceptanceBy: null };
  }
  if (error) throw new Error(error.message);

  return {
    id: data.id,
    status: (data.status as "pending" | "accepted") ?? "accepted",
    pendingAcceptanceBy: data.pending_acceptance_by ?? null,
  };
}

export interface ConversationSummary {
  id: string;
  otherId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: boolean;
  status: "pending" | "accepted";
  /** True when the viewer is the one who owes an accept/decline. */
  isIncomingRequest: boolean;
}

export async function listConversations(ownerId: string): Promise<ConversationSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data: convos, error } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b, status, pending_acceptance_by")
    .or(`participant_a.eq.${ownerId},participant_b.eq.${ownerId}`);
  if (error) throw new Error(error.message);
  if (!convos || convos.length === 0) return [];

  const ids = convos.map((c) => c.id);
  const { data: messages } = await supabase
    .from("messages")
    .select("conversation_id, body, sender_id, created_at, read_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false });

  return convos
    .map((c) => {
      const otherId = c.participant_a === ownerId ? c.participant_b : c.participant_a;
      const convoMessages = (messages ?? []).filter((m) => m.conversation_id === c.id);
      const last = convoMessages[0];
      const unread = convoMessages.some((m) => m.sender_id !== ownerId && !m.read_at);
      const status = ((c.status as "pending" | "accepted") ?? "accepted") as "pending" | "accepted";
      return {
        id: c.id,
        otherId,
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.created_at ?? null,
        unread,
        status,
        isIncomingRequest: status === "pending" && c.pending_acceptance_by === ownerId,
      };
    })
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

export interface MessageItem {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export async function getMessages(conversationId: string): Promise<MessageItem[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((m) => ({ id: m.id, senderId: m.sender_id, body: m.body, createdAt: m.created_at }));
}

export async function getConversationMeta(conversationId: string): Promise<ConversationMeta | null> {
  const { data } = await getSupabaseAdmin()
    .from("conversations")
    .select("id, status, pending_acceptance_by")
    .eq("id", conversationId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    status: (data.status as "pending" | "accepted") ?? "accepted",
    pendingAcceptanceBy: data.pending_acceptance_by ?? null,
  };
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<MessageItem> {
  const { data, error } = await getSupabaseAdmin()
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("id, sender_id, body, created_at")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, senderId: data.sender_id, body: data.body, createdAt: data.created_at };
}

export async function markConversationRead(conversationId: string, viewerId: string): Promise<void> {
  await getSupabaseAdmin()
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", viewerId)
    .is("read_at", null);
}

/** Verifies `userId` is actually a participant before letting them read a
 * conversation by id — conversation ids aren't otherwise secret/unguessable. */
export async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from("conversations")
    .select("participant_a, participant_b")
    .eq("id", conversationId)
    .maybeSingle();
  if (!data) return false;
  return data.participant_a === userId || data.participant_b === userId;
}

/** Accept a pending request — only the person it's pending on can accept. */
export async function acceptConversation(conversationId: string, viewerId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("conversations")
    .update({ status: "accepted", pending_acceptance_by: null })
    .eq("id", conversationId)
    .eq("pending_acceptance_by", viewerId);
  if (error) throw new Error(error.message);
}

/** Decline — deletes the conversation and its messages outright, same as
 * how a declined DM request disappears rather than lingering read-only. */
export async function declineConversation(conversationId: string, viewerId: string): Promise<void> {
  const { data } = await getSupabaseAdmin()
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("pending_acceptance_by", viewerId)
    .maybeSingle();
  if (!data) throw new Error("Not found");

  await getSupabaseAdmin().from("messages").delete().eq("conversation_id", conversationId);
  const { error } = await getSupabaseAdmin().from("conversations").delete().eq("id", conversationId);
  if (error) throw new Error(error.message);
}
