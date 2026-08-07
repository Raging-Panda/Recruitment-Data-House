import type { RepoActivityEvent } from "@ipskill/shared";
import { EmptyState } from "@/components/empty-state";
import { ActivityIcon, TagIcon } from "@/components/icons";
import { formatRelativeTime } from "@/lib/format";

const TYPE_ICON: Record<RepoActivityEvent["type"], string | null> = {
  commit: "●",
  pull_request: "⇄",
  release: null,
};

const TYPE_LABEL: Record<RepoActivityEvent["type"], string> = {
  commit: "Commit",
  pull_request: "Pull request",
  release: "Release",
};

export function ActivityTimeline({ events }: { events: RepoActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        className="mt-4"
        icon={ActivityIcon}
        title="No recent activity yet"
        description="Commits, PRs, and releases across your repos will show up here."
      />
    );
  }

  return (
    <ol className="mt-4 flex flex-col gap-3 border-l border-surface-border pl-5">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[1.65rem] top-1 text-xs text-primary">
            {TYPE_ICON[event.type] ?? <TagIcon size={12} />}
          </span>
          <a
            href={event.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg p-1 hover:bg-surface"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
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
            <p className="mt-0.5 text-sm text-heading">{event.title}</p>
          </a>
        </li>
      ))}
    </ol>
  );
}
