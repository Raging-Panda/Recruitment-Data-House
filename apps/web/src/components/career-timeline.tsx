import type { WorkExperience, Certification } from "@ipskill/shared";
import { EmptyState } from "@/components/empty-state";
import { ActivityIcon } from "@/components/icons";

/**
 * One dated story for the profile — work history and certifications
 * interleaved chronologically, so the page reads as a trajectory rather
 * than four separate cards. Deliberately *not* folding in day-level GitHub
 * commits/PRs (those have their own feed on the Projects page); this is the
 * career spine, at the resolution of roles and credentials.
 */

interface TimelineItem {
  key: string;
  date: string; // ISO or YYYY-MM / YYYY-MM-DD
  endDate?: string | null;
  isCurrent?: boolean;
  kind: "role" | "certification";
  title: string;
  subtitle: string;
  detail?: string | null;
}

function fmt(value: string | null | undefined, isCurrent = false): string {
  if (isCurrent) return "Present";
  if (!value) return "—";
  const d = new Date(value.length === 7 ? `${value}-01T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function sortKey(item: TimelineItem): number {
  const v = item.date;
  const d = new Date(v.length === 7 ? `${v}-01T00:00:00Z` : v);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function CareerTimeline({
  experience,
  certifications,
}: {
  experience: WorkExperience[];
  certifications: Certification[];
}) {
  const items: TimelineItem[] = [
    ...experience.map((e) => ({
      key: `role-${e.id}`,
      date: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      kind: "role" as const,
      title: e.role,
      subtitle: e.location ? `${e.company} · ${e.location}` : e.company,
      detail: e.description,
    })),
    ...certifications.map((c) => ({
      key: `cert-${c.id}`,
      date: c.issueDate,
      kind: "certification" as const,
      title: c.name,
      subtitle: c.issuer,
      detail: c.description,
    })),
  ].sort((a, b) => sortKey(b) - sortKey(a));

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No career history yet"
        description="Add a role or a certification and it shows up here as one dated story."
      />
    );
  }

  return (
    <ol className="relative ml-2 border-l border-surface-border">
      {items.map((item) => (
        <li key={item.key} className="ml-6 pb-6 last:pb-0">
          <span
            className={`absolute -left-[6px] mt-1 h-3 w-3 rounded-full border-2 border-background-elevated ${
              item.kind === "role" ? "bg-primary" : "bg-accent-green"
            }`}
            aria-hidden
          />
          <p className="text-xs text-text-muted">
            {item.kind === "role"
              ? `${fmt(item.date)} — ${fmt(item.endDate, item.isCurrent)}`
              : fmt(item.date)}
            <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-secondary">
              {item.kind === "role" ? "Role" : "Certification"}
            </span>
          </p>
          <p className="mt-1 text-sm font-semibold text-heading">{item.title}</p>
          <p className="text-xs text-text-secondary">{item.subtitle}</p>
          {item.detail && (
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-text-muted">
              {item.detail}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
