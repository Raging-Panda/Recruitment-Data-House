import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getRecruiterEngagement, type RecruiterEngagementSummary } from "@/lib/recruiter-engagement";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_RECRUITER_ENGAGEMENT } from "@/lib/demo-data";
import { StatTile } from "@/components/stat-tile";
import { EmptyState } from "@/components/empty-state";
import { EyeIcon } from "@/components/icons";

function formatDuration(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function RecruiterEngagementPage() {
  const session = await getServerSession(authOptions);
  const githubId = session!.githubId!;

  let summary: RecruiterEngagementSummary;
  if (isDemoAccount(githubId)) {
    summary = DEMO_RECRUITER_ENGAGEMENT;
  } else {
    try {
      summary = await getRecruiterEngagement(githubId);
    } catch {
      summary = { totalShortlisted: 0, viewedCount: 0, viewedPct: 0, avgTimeToFirstViewHours: null, candidates: [] };
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-heading">Engagement</h1>
      <p className="mt-1 text-sm text-text-secondary">
        The inverse of your own Analytics screen — how much you&apos;ve actually engaged with the
        candidates you&apos;ve shortlisted, not just saved.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Shortlisted Candidates" value={String(summary.totalShortlisted)} />
        <StatTile
          label="Viewed At Least Once"
          value={`${summary.viewedPct}%`}
          sublabel={`${summary.viewedCount} of ${summary.totalShortlisted}`}
        />
        <StatTile
          label="Avg. Time to First View"
          value={summary.avgTimeToFirstViewHours !== null ? formatDuration(summary.avgTimeToFirstViewHours) : "—"}
          sublabel="after shortlisting"
        />
      </div>

      <div className="mt-6">
        {summary.candidates.length === 0 ? (
          <EmptyState
            icon={EyeIcon}
            title="No shortlisted candidates yet"
            description="Bookmark developers from the Directory to start tracking engagement here."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-border bg-background-elevated">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Shortlist</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Time to First View</th>
                  <th className="px-4 py-3 font-medium">Last Viewed</th>
                </tr>
              </thead>
              <tbody>
                {summary.candidates.map((c) => (
                  <tr key={c.githubId} className="border-b border-surface-border last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/recruiter/directory/${c.githubId}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        {c.avatarUrl ? (
                          <Image src={c.avatarUrl} alt={c.displayName} width={28} height={28} className="rounded-full" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-primary-gradient" />
                        )}
                        <span className="font-medium text-heading">{c.displayName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{c.shortlistNames.join(", ")}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(c.addedAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          c.viewCount > 0 ? "font-semibold text-primary" : "text-text-muted"
                        }
                      >
                        {c.viewCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {c.timeToFirstViewHours !== null ? formatDuration(c.timeToFirstViewHours) : "Not viewed"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {c.lastViewedAt ? formatDate(c.lastViewedAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
