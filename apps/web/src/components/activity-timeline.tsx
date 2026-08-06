import type { RepoActivityEvent } from "@ipskill/shared";

const TYPE_ICON: Record<RepoActivityEvent["type"], string> = {
  commit: "●",
  pull_request: "⇄",
  release: "🏷",
};

const TYPE_LABEL: Record<RepoActivityEvent["type"], string> = {
  commit: "Commit",
  pull_request: "Pull request",
  release: "Release",
};

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.round(diffMs / 60_000);
  if (diffMinutes < 60) return `${Math.max(diffMinutes, 0)}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.round(diffMonths / 12)}y ago`;
}

export function ActivityTimeline({ events }: { events: RepoActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="mt-4 text-sm text-text-muted">
        No recent commits, PRs, or releases found across your repos.
      </p>
    );
  }

  return (
    <ol className="mt-4 flex flex-col gap-3 border-l border-surface-border pl-5">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[1.65rem] top-1 text-xs text-primary">
            {TYPE_ICON[event.type]}
          </span>
          <a
            href={event.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg p-1 hover:bg-surface"
          >
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="font-semibold text-text-secondary">{event.repoName}</span>
              <span>·</span>
              <span>{TYPE_LABEL[event.type]}</span>
              {event.state && (
                <>
                  <span>·</span>
                  <span className="capitalize">{event.state}</span>
                </>
              )}
              <span>·</span>
              <span>{formatRelativeTime(event.occurredAt)}</span>
            </div>
            <p className="mt-0.5 text-sm text-white">{event.title}</p>
          </a>
        </li>
      ))}
    </ol>
  );
}
