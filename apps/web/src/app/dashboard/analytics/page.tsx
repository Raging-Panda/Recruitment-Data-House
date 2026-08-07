import { getServerSession } from "next-auth";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import { loadDeveloperHubData } from "@/lib/developer-data";
import { splitStrengthsAndGaps, sortedSkillEntries, computeLearningMomentum } from "@/lib/analysis";
import { SkillRadarChart } from "@/components/skill-radar-chart";
import { CommitTrendChart } from "@/components/commit-trend-chart";
import { StatTile } from "@/components/stat-tile";
import { BentoPlaceholder } from "@/components/bento-placeholder";
import { ProfileViewsStat } from "@/components/profile-views-stat";
import { NextPositionSuggestionsSection } from "@/components/next-position-suggestions-section";
import { Skeleton } from "@/components/skeleton";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const { profile, skillFingerprint, activity, analytics, projects } = await loadDeveloperHubData(
    session!.accessToken!,
    session!.githubId!
  );

  const { strengths, improvementAreas } = splitStrengthsAndGaps(skillFingerprint);
  const categoryBreakdown = sortedSkillEntries(skillFingerprint);
  const learningMomentum = computeLearningMomentum(activity.commitActivity);
  const careerReadiness = Math.round(
    (profile.overallScore + Math.max(0, 100 - profile.percentileRank)) / 2
  );

  // Search Appearances and Connection Requests stay as the derived
  // placeholder until the platform has its own tracking for those too —
  // Profile Views is real but streams in separately below (see
  // ProfileViewsStat), since it needs an extra fetch this page's core data
  // doesn't.
  const engagementStats = [
    {
      label: "Search Appearances",
      value: analytics.searchAppearances.toLocaleString(),
      sublabel: `↑ ${analytics.searchAppearancesChangePct}% vs last month`,
      sublabelClassName: "text-accent-green",
    },
    {
      label: "Connection Requests",
      value: analytics.connectionRequests.toLocaleString(),
      sublabel: `↑ ${analytics.connectionRequestsChangePct}% vs last month`,
      sublabelClassName: "text-accent-green",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-heading">My Analysis</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Deep insights into your skills, growth, and career potential — derived from your GitHub
        activity.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatTile
          label="Overall Analysis Score"
          value={`${profile.overallScore}%`}
          sublabel={profile.overallScore >= 70 ? "Excellent" : "Building up"}
          sublabelClassName="text-accent-green"
        />
        <StatTile
          label="Skills Strength"
          value={String(strengths.length)}
          sublabel="Strong Skills"
        />
        <StatTile
          label="Improvement Areas"
          value={String(improvementAreas.length)}
          sublabel="Focus Areas"
        />
        <StatTile
          label="Career Readiness"
          value={`${careerReadiness}%`}
          sublabel={careerReadiness >= 70 ? "Highly Ready" : "In Progress"}
          sublabelClassName="text-accent-green"
        />
        <StatTile
          label="Learning Momentum"
          value={`${learningMomentum >= 0 ? "↑" : "↓"} ${Math.abs(learningMomentum)}%`}
          sublabel="vs prior 4 weeks"
          sublabelClassName={learningMomentum >= 0 ? "text-accent-green" : "text-accent-red"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-surface-border bg-background-elevated p-6 md:col-span-2">
          <h3 className="text-sm font-semibold text-heading">Skill Radar Analysis</h3>
          <p className="mt-1 text-xs text-text-secondary">
            Your proficiency across key skill domains
          </p>
          <SkillRadarChart fingerprint={skillFingerprint} />
        </div>

        <div className="rounded-2xl border border-surface-border bg-background-elevated p-6">
          <h3 className="text-sm font-semibold text-heading">Skill Category Breakdown</h3>
          <div className="mt-4 flex flex-col gap-3">
            {categoryBreakdown.map(([category, score]) => (
              <div key={category}>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>{category}</span>
                  <span>{score}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface">
                  <div
                    className="h-2 rounded-full bg-primary-gradient"
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
            <h3 className="text-sm font-semibold text-heading">Strengths</h3>
            <div className="mt-3 flex flex-col gap-3">
              {strengths.slice(0, 4).map(([category, score]) => (
                <div key={category} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-accent-green">✓</span>
                  <div>
                    <p className="text-heading">{category}</p>
                    <p className="text-xs text-text-muted">{score}% proficiency</p>
                  </div>
                </div>
              ))}
              {strengths.length === 0 && (
                <p className="text-sm text-text-muted">
                  Keep shipping — no category has crossed the strength threshold yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
            <h3 className="text-sm font-semibold text-heading">Improvement Areas</h3>
            <div className="mt-3 flex flex-col gap-3">
              {improvementAreas.slice(0, 4).map(([category, score]) => (
                <div key={category} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-accent-amber">●</span>
                  <div>
                    <p className="text-heading">{category}</p>
                    <p className="text-xs text-text-muted">{score}% — focus area</p>
                  </div>
                </div>
              ))}
              {improvementAreas.length === 0 && (
                <p className="text-sm text-text-muted">
                  Every category is above the strength threshold. Nice work.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-surface-border bg-background-elevated p-6">
          <h3 className="text-sm font-semibold text-heading">Growth Trend</h3>
          <p className="mt-1 text-xs text-text-secondary">
            Public commit activity, last {Math.min(activity.commitActivity.length, 12)} weeks
          </p>
          <CommitTrendChart commitActivity={activity.commitActivity} />
        </div>

        <BentoPlaceholder
          title="Skill Gap Analysis"
          description="Benchmarking your skills against live market demand needs a jobs/salary data source we haven't wired up yet."
        />
      </div>

      <div className="mt-6">
        <Suspense fallback={<NextPositionCardSkeleton />}>
          <NextPositionSuggestionsSection
            githubId={session!.githubId!}
            skillFingerprint={skillFingerprint}
            languageBreakdown={activity.languageBreakdown}
            projects={projects}
            overallScore={profile.overallScore}
          />
        </Suspense>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-heading">Engagement</h2>
        <p className="mt-1 text-xs text-text-muted">
          Profile Views is tracked live from the Directory. Search Appearances and Connection
          Requests are still estimated until that tracking exists.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Suspense fallback={<StatTileSkeleton />}>
            <ProfileViewsStat
              githubId={session!.githubId!}
              fallbackValue={analytics.profileViews}
              fallbackChangePct={analytics.profileViewsChangePct}
            />
          </Suspense>
          {engagementStats.map((stat) => (
            <StatTile
              key={stat.label}
              label={stat.label}
              value={stat.value}
              sublabel={stat.sublabel}
              sublabelClassName={stat.sublabelClassName}
            />
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-surface-border bg-background-elevated p-5">
          <p className="text-sm font-semibold text-heading">Top Countries</p>
          <div className="mt-3 flex flex-col gap-2">
            {analytics.topCountries.map((c) => (
              <div key={c.country} className="flex items-center gap-3 text-sm">
                <span className="w-32 text-text-secondary">{c.country}</span>
                <div className="h-2 flex-1 rounded-full bg-surface">
                  <div
                    className="h-2 rounded-full bg-primary-gradient"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-text-secondary">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTileSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

function NextPositionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-4 h-6 w-40" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-3/4" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
  );
}
