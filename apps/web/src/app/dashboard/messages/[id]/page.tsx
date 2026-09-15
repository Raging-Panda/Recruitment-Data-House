import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoAccount } from "@/lib/demo-mode";
import {
  getMessages,
  isParticipant,
  markConversationRead,
  getConversationMeta,
} from "@/lib/messaging";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDirectoryEntry } from "@/lib/directory";
import { MessageThread } from "@/components/message-thread";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (isDemoAccount(session!.githubId)) notFound();

  const allowed = await isParticipant(params.id, session!.githubId!).catch(() => false);
  if (!allowed) notFound();

  const { data: convo } = await getSupabaseAdmin()
    .from("conversations")
    .select("participant_a, participant_b")
    .eq("id", params.id)
    .maybeSingle();
  const otherId = convo?.participant_a === session!.githubId ? convo?.participant_b : convo?.participant_a;
  const other = otherId ? await getDirectoryEntry(otherId).catch(() => null) : null;

  const meta = await getConversationMeta(params.id);
  const isPendingOnMe = meta?.status === "pending" && meta.pendingAcceptanceBy === session!.githubId;
  const isPendingOnThem = meta?.status === "pending" && !isPendingOnMe;

  const messages = await getMessages(params.id).catch(() => []);
  void markConversationRead(params.id, session!.githubId!);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/messages" className="text-sm text-text-secondary hover:text-heading">
        ← Messages
      </Link>
      <h1 className="mt-2 text-xl font-bold text-heading">{other?.displayName ?? "Conversation"}</h1>

      <div className="mt-4 rounded-2xl border border-surface-border bg-background-elevated p-5">
        {isPendingOnThem && (
          <p className="mb-4 rounded-lg bg-surface px-3 py-2 text-xs text-text-muted">
            Waiting for {other?.displayName ?? "them"} to accept your request.
          </p>
        )}
        <MessageThread
          conversationId={params.id}
          initialMessages={messages}
          viewerId={session!.githubId!}
          otherName={other?.displayName ?? "them"}
          pendingRequest={isPendingOnMe}
        />
      </div>
    </div>
  );
}
