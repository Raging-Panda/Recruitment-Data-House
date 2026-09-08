import { StatTile } from "@/components/stat-tile";
import { isDemoAccount } from "@/lib/demo-mode";
import { isTestAccount } from "@/lib/test-mode";
import { getProfileViewStats } from "@/lib/profile-views";

/**
 * Async Server Component rendered inside its own <Suspense> boundary on the
 * Analytics page — it needs an extra Supabase round trip beyond the core
 * loadDeveloperHubData fetch every other stat tile uses, so isolating it
 * lets the rest of the page (already resolved) stream in first instead of
 * waiting on this too.
 */
export async function ProfileViewsStat({
  githubId,
  fallbackValue,
  fallbackChangePct,
}: {
  githubId: string;
  fallbackValue: number;
  fallbackChangePct: number;
}) {
  let value = fallbackValue.toLocaleString();
  let sublabel = `↑ ${fallbackChangePct}% vs last month`;
  let sublabelClassName = "text-accent-green";

  if (!isDemoAccount(githubId) && !isTestAccount(githubId)) {
    try {
      const stats = await getProfileViewStats(githubId);
      value = stats.total.toLocaleString();
      if (stats.changePct === null) {
        sublabel = stats.total > 0 ? "New this month" : "No views yet";
        sublabelClassName = "text-text-muted";
      } else {
        const arrow = stats.changePct >= 0 ? "↑" : "↓";
        sublabel = `${arrow} ${Math.abs(stats.changePct)}% vs last month`;
        sublabelClassName = stats.changePct >= 0 ? "text-accent-green" : "text-accent-red";
      }
    } catch {
      // fall back to the derived placeholder already assigned above
    }
  }

  return (
    <StatTile label="Profile Views" value={value} sublabel={sublabel} sublabelClassName={sublabelClassName} />
  );
}
