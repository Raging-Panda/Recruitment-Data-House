import type { WorkExperience, Certification, FeaturedProject, DeveloperProject } from "@ipskill/shared";
import type { VerifiedSkillMilestone } from "@/lib/skill-tests";
import { EmptyState } from "@/components/empty-state";
import { ActivityIcon } from "@/components/icons";

/**
 * One dated story for the profile — work history, certifications, verified
 * skill passes, and a few coarse GitHub milestones, interleaved
 * chronologically, so the page reads as a trajectory rather than four
 * separate cards. Deliberately *not* folding in day-level GitHub
 * commits/PRs (those have their own feed on the Projects page) — GitHub
 * only shows up here as "Joined GitHub" and "Started building {featured
 * project}", the resolution a career story actually cares about.
 */

interface TimelineItem {
  key: string;
  date: string; // ISO or YYYY-MM / YYYY-MM-DD
  endDate?: string | null;
  isCurrent?: boolean;
  kind: "role" | "certification" | "skill" | "github";
  title: string;
  subtitle: string;
  detail?: string | null;
}

const DOT_CLASS: Record<TimelineItem["kind"], string> = {
  role: "bg-primary",
  certification: "bg-accent-green",
  skill: "bg-accent-amber",
  github: "bg-text-muted",
};

const KIND_LABEL: Record<TimelineItem["kind"], string> = {
  role: "Role",
  certification: "Certification",
  skill: "Verified Skill",
  github: "GitHub",
};

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

/** Cross-references the candidate's own curated Featured Project pins
 * against their (already-fetched) repo list by name, so "Started
 * building X" only surfaces for projects they chose to highlight —
 * not a noisy entry per repo. Silently skips a pin whose repo isn't in
 * the current repo list (renamed, deleted, or simply outside the
 * server-side repo cap) rather than guessing at a date. */
function buildGithubMilestones(
  joinedGithubAt: string | null,
  featuredProjects: FeaturedProject[],
  projects: DeveloperProject[]
): TimelineItem[] {
  const items: TimelineItem[] = [];
  if (joinedGithubAt) {
    items.push({
      key: "github-joined",
      date: joinedGithubAt,
      kind: "github",
      title: "Joined GitHub",
      subtitle: "Where the public track record starts",
    });
  }

  const projectByName = new Map(projects.map((p) => [p.name, p]));
  for (const fp of featuredProjects) {
    const project = projectByName.get(fp.repoName);
    if (!project) continue;
    items.push({
      key: `github-repo-${fp.id}`,
      date: project.createdAt,
      kind: "github",
      title: `Started building ${fp.repoName}`,
      subtitle: fp.languages.length > 0 ? fp.languages.join(", ") : "GitHub repository",
    });
  }
  return items;
}

export function CareerTimeline({
  experience,
  certifications,
  verifiedSkills = [],
  joinedGithubAt = null,
  featuredProjects = [],
  projects = [],
}: {
  experience: WorkExperience[];
  certifications: Certification[];
  /** Skill tests the candidate has passed — Supabase-only, so available
   * even without a GitHub connection. Optional/defaulted so existing
   * callers don't all need updating at once. */
  verifiedSkills?: VerifiedSkillMilestone[];
  /** The rest only apply with a GitHub connection — undefined/empty for
   * a ThinProfile (Google/LinkedIn/local sign-in, no linked GitHub). */
  joinedGithubAt?: string | null;
  featuredProjects?: FeaturedProject[];
  projects?: DeveloperProject[];
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
    ...verifiedSkills.map((v) => ({
      key: `skill-${v.templateId}`,
      date: v.submittedAt,
      kind: "skill" as const,
      title: `Verified: ${v.title}`,
      subtitle: `${v.percentage}% score`,
    })),
    ...buildGithubMilestones(joinedGithubAt, featuredProjects, projects),
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
            className={`absolute -left-[6px] mt-1 h-3 w-3 rounded-full border-2 border-background-elevated ${DOT_CLASS[item.kind]}`}
            aria-hidden
          />
          <p className="text-xs text-text-muted">
            {item.kind === "role"
              ? `${fmt(item.date)} — ${fmt(item.endDate, item.isCurrent)}`
              : fmt(item.date)}
            <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-secondary">
              {KIND_LABEL[item.kind]}
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
