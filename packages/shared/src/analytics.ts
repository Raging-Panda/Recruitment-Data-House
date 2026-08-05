import type { AnalyticsSnapshot } from "./types";

/**
 * Profile views / search appearances / connection requests are IPSkill-native
 * engagement metrics, not something the GitHub API exposes. Until the
 * platform has its own event tracking wired up, derive a deterministic
 * placeholder from account signals so the Analytics screen isn't empty.
 */
export function deriveAnalyticsSnapshot(seed: {
  followers: number;
  publicRepoCount: number;
}): AnalyticsSnapshot {
  const base = seed.followers * 12 + seed.publicRepoCount * 30;
  return {
    profileViews: Math.max(base, 40),
    profileViewsChangePct: 24.5,
    searchAppearances: Math.round(Math.max(base, 40) * 0.25),
    searchAppearancesChangePct: 18.2,
    connectionRequests: Math.round(Math.max(base, 40) * 0.02),
    connectionRequestsChangePct: 21.1,
    topCountries: [
      { country: "United States", percentage: 45 },
      { country: "India", percentage: 22 },
      { country: "United Kingdom", percentage: 12 },
      { country: "Canada", percentage: 8 },
      { country: "Others", percentage: 13 },
    ],
  };
}
