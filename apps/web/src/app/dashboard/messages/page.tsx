import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoAccount } from "@/lib/demo-mode";
import { listConversations } from "@/lib/messaging";
import { getDirectoryEntriesByIds } from "@/lib/directory";
import { EmptyState } from "@/components/empty-state";
import { BellIcon } from "@/components/icons";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  const isDemo = isDemoAccount(session!.githubId);
  const conversations = isDemo ? [] : await listConversations(session!.githubId!).catch(() => []);
  const others = await getDirectoryEntriesByIds(conversations.map((c) => c.otherId)).catch(() => []);
  const otherMap = new Map(others.map((o) => [o.githubId, o]));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-heading">Messages</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Talk directly with developers/recruiters on IPSkill — start a conversation from a Directory
        profile.
      </p>

      {isDemo || conversations.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={BellIcon}
          title="No conversations yet"
          description={isDemo ? "Messaging is disabled for the shared demo account." : "Message someone from their Directory profile to start one."}
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {conversations.map((c) => {
            const other = otherMap.get(c.otherId);
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/messages/${c.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-surface-border bg-background-elevated p-4 transition hover:border-primary"
                >
                  {other?.avatarUrl ? (
                    <Image src={other.avatarUrl} alt={other.displayName} width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-gradient" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-heading">
                      {other?.displayName ?? "A developer"}
                    </p>
                    <p className="truncate text-xs text-text-secondary">{c.lastMessage ?? "No messages yet"}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-text-muted">{timeAgo(c.lastMessageAt)}</span>
                    {c.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
