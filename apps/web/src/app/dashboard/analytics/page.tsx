import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadDeveloperHubData } from "@/lib/developer-data";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const { analytics } = await loadDeveloperHubData(session!.accessToken!);

  const stats = [
    {
      label: "Profile Views",
      value: analytics.profileViews.toLocaleString(),
      change: analytics.profileViewsChangePct,
    },
    {
      label: "Search Appearances",
      value: analytics.searchAppearances.toLocaleString(),
      change: analytics.searchAppearancesChangePct,
    },
    {
      label: "Connection Requests",
      value: analytics.connectionRequests.toLocaleString(),
      change: analytics.connectionRequestsChangePct,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>
      <p className="mt-1 text-xs text-text-muted">
        Engagement metrics are estimated from account signals until platform-native tracking
        ships.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-surface-border bg-background-elevated p-5"
          >
            <p className="text-sm text-text-secondary">{stat.label}</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              <span className="text-sm text-accent-green">↑ {stat.change}% vs last month</span>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
          <p className="text-sm font-semibold text-white">Top Countries</p>
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
