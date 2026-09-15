import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<string> {
  if (userA === userB) throw new Error("Can't message yourself");
  const [participantA, participantB] = canonicalPair(userA, userB);
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_a", participantA)
    .eq("participant_b", participantB)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ participant_a: participantA, participant_b: participantB })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export interface ConversationSummary {
  id: string;
  otherId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: boolean;
}

export async function listConversations(ownerId: string): Promise<ConversationSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data: convos, error } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b")
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
      return {
        id: c.id,
        otherId,
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.created_at ?? null,
        unread,
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
