import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlan } from "@/lib/premium";
import { hasPremiumDevAccess } from "@/lib/plan";
import { getGrowthLeaderboard } from "@/lib/growth";
import { GrowthUpgradeCta } from "@/components/growth-upgrade-cta";

export default async function GrowthOlympicsPage() {
  const session = await getServerSession(authOptions);
  const plan = await getPlan(session!.githubId);
  const eligible = hasPremiumDevAccess(plan);

  const leaderboard = eligible ? await getGrowthLeaderboard().catch(() => []) : [];
  const myRank = leaderboard.findIndex((e) => e.githubId === session!.githubId);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-heading">Growth Olympics</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Monthly leaderboard — fingerprint growth, weighted toward concrete milestones (new roles,
        certifications, verified skills passed) over raw score movement alone.
      </p>

      {!eligible ? (
        <GrowthUpgradeCta />
      ) : (
        <>
          {myRank >= 0 && (
            <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm text-heading">
              You're #{myRank + 1} this month — {leaderboard[myRank].growthScore} growth points.
            </div>
          )}
          <ol className="mt-6 space-y-2">
            {leaderboard.map((entry, i) => (
              <li
                key={entry.githubId}
                className="flex items-center gap-3 rounded-2xl border border-surface-border bg-background-elevated p-4"
              >
                <span className="w-6 text-sm font-bold text-text-muted">#{i + 1}</span>
                {entry.avatarUrl ? (
                  <Image src={entry.avatarUrl} alt={entry.displayName} width={36} height={36} className="rounded-full" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary-gradient" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-heading">{entry.displayName}</p>
                  <p className="text-xs text-text-muted">
                    {entry.scoreDelta >= 0 ? "+" : ""}
                    {entry.scoreDelta} score · {entry.newPositions} new roles · {entry.newCertifications} certs ·{" "}
                    {entry.skillsLeveledUp} skills passed
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-primary">{entry.growthScore} pts</span>
              </li>
            ))}
          </ol>
          {leaderboard.length === 0 && (
            <p className="mt-10 text-center text-sm text-text-muted">
              No growth data yet this month — check back after some activity.
            </p>
          )}
        </>
      )}
    </div>
  );
}
