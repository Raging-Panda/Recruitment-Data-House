import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFollowingFeed } from "@/lib/social";
import { getDirectoryEntriesByIds } from "@/lib/directory";
import { EmptyState } from "@/components/empty-state";
import { ActivityIcon } from "@/components/icons";
import { KudosButton } from "@/components/kudos-button";

const TYPE_LABELS: Record<string, string> = {
  skill_test_completed: "passed a skill test",
  certification_added: "earned a certification",
  featured_project_added: "featured a project",
  endorsement_received: "got endorsed",
};

function timeAgo(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  const events = await getFollowingFeed(session!.githubId!).catch(() => []);
  const owners = await getDirectoryEntriesByIds([...new Set(events.map((e) => e.ownerId))]).catch(() => []);
  const ownerMap = new Map(owners.map((o) => [o.githubId, o]));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-heading">Feed</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Milestones from developers you follow — follow someone from their Directory profile.
      </p>

      {events.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={ActivityIcon}
          title="Nothing yet"
          description="Follow other developers from the Directory to see their milestones here."
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {events.map((event) => {
            const owner = ownerMap.get(event.ownerId);
            return (
              <li key={event.id} className="rounded-2xl border border-surface-border bg-background-elevated p-4">
                <p className="text-sm text-heading">
                  <span className="font-semibold">{owner?.displayName ?? "A developer"}</span>{" "}
                  {TYPE_LABELS[event.type] ?? event.title}
                </p>
                {event.body && <p className="mt-1 text-xs text-text-secondary">{event.body}</p>}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-text-muted">{timeAgo(event.occurredAt)}</span>
                  <KudosButton eventId={event.id} initialCount={event.kudosCount} initialGiven={event.kudosedByMe} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
