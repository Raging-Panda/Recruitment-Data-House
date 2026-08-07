import { deriveAnalyticsSnapshot, type RepoActivityEvent } from "@ipskill/shared";
import type { DeveloperHubData } from "./developer-data";
import { TEST_GITHUB_ID } from "./test-mode";

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

/**
 * Fixture data for the test-account bypass (see test-mode.ts) — shaped
 * exactly like the real GitHub-derived data so every page renders
 * realistically without an actual GitHub access token.
 */
export function buildMockDeveloperHubData(): DeveloperHubData {
  const languageBreakdown = [
    { language: "TypeScript", bytes: 420_000, percentage: 42, lastUsedAt: new Date(NOW - 3 * DAY).toISOString() },
    { language: "Python", bytes: 260_000, percentage: 26, lastUsedAt: new Date(NOW - 20 * DAY).toISOString() },
    { language: "Go", bytes: 150_000, percentage: 15, lastUsedAt: new Date(NOW - 45 * DAY).toISOString() },
    // Deliberately stale (>12 months) so the freshness indicator has
    // something to flag when testing/demoing this account.
    { language: "SQL", bytes: 90_000, percentage: 9, lastUsedAt: new Date(NOW - 540 * DAY).toISOString() },
    { language: "CSS", bytes: 80_000, percentage: 8, lastUsedAt: new Date(NOW - 400 * DAY).toISOString() },
  ];

  const commitActivity = Array.from({ length: 12 }, (_, i) => ({
    weekStart: new Date(NOW - (11 - i) * WEEK).toISOString().slice(0, 10),
    commitCount: [4, 6, 3, 8, 10, 7, 9, 12, 11, 14, 13, 16][i],
  }));

  const activity: DeveloperHubData["activity"] = {
    languageBreakdown,
    commitActivity,
    totalPullRequests: 38,
    mergedPullRequests: 31,
    codeReviews: 22,
    issuesOpened: 14,
    issuesClosed: 12,
    publicRepoCount: 9,
    followers: 27,
  };

  const skillFingerprint: DeveloperHubData["skillFingerprint"] = {
    Backend: 78,
    Frontend: 65,
    Database: 54,
    DevOps: 47,
    Cloud: 40,
    "Problem Solving": 71,
    Communication: 58,
    Leadership: 33,
  };

  const projects: DeveloperHubData["projects"] = [
    {
      id: "mock-1",
      name: "test-order-service",
      description: "Event-driven order processing service with a saga-based checkout flow.",
      languages: ["Go", "SQL"],
      stars: 14,
      watchers: 5,
      updatedAt: new Date(NOW - 2 * DAY).toISOString(),
      url: "https://github.com/octocat/test-order-service",
      quality: { hasTests: true, hasReadme: true, hasCi: true, hasLicense: true },
      category: "Featured",
    },
    {
      id: "mock-2",
      name: "test-dashboard-ui",
      description: "Internal analytics dashboard built with React and TypeScript.",
      languages: ["TypeScript", "CSS"],
      stars: 6,
      watchers: 2,
      updatedAt: new Date(NOW - 9 * DAY).toISOString(),
      url: "https://github.com/octocat/test-dashboard-ui",
      quality: { hasTests: true, hasReadme: true, hasCi: false, hasLicense: false },
      category: "Personal",
    },
    {
      id: "mock-3",
      name: "test-data-pipeline",
      description: "Scheduled ETL jobs for warehouse sync.",
      languages: ["Python"],
      stars: 3,
      watchers: 1,
      updatedAt: new Date(NOW - 21 * DAY).toISOString(),
      url: "https://github.com/octocat/test-data-pipeline",
      quality: { hasTests: false, hasReadme: true, hasCi: false, hasLicense: true },
      category: "Personal",
    },
  ];

  const overallScore = Math.round(
    Object.values(skillFingerprint).reduce((sum, v) => sum + v, 0) /
      Object.values(skillFingerprint).length
  );

  const profile: DeveloperHubData["profile"] = {
    id: TEST_GITHUB_ID,
    name: "Test Developer",
    headline: "Backend Developer",
    location: "Cape Town, South Africa",
    avatarUrl: "https://avatars.githubusercontent.com/u/9919?s=200&v=4",
    githubLogin: "test-developer",
    availableForOpportunities: true,
    overallScore,
    percentileRank: Math.max(1, Math.round(100 - overallScore * 0.9)),
    about: "Fixture account for exercising IPSkill's UI without a real GitHub login.",
  };

  return {
    profile,
    skillFingerprint,
    projects,
    activity,
    analytics: deriveAnalyticsSnapshot({
      followers: activity.followers,
      publicRepoCount: activity.publicRepoCount,
    }),
  };
}

export function buildMockActivityTimeline(): RepoActivityEvent[] {
  return [
    {
      id: "mock-commit-1",
      repoName: "test-order-service",
      repoUrl: "https://github.com/octocat/test-order-service",
      type: "commit",
      title: "Add retry backoff to payment webhook handler",
      url: "https://github.com/octocat/test-order-service/commit/abc123",
      occurredAt: new Date(NOW - 1 * DAY).toISOString(),
    },
    {
      id: "mock-pr-1",
      repoName: "test-dashboard-ui",
      repoUrl: "https://github.com/octocat/test-dashboard-ui",
      type: "pull_request",
      title: "Migrate charts to server components",
      url: "https://github.com/octocat/test-dashboard-ui/pull/42",
      occurredAt: new Date(NOW - 3 * DAY).toISOString(),
      state: "merged",
    },
    {
      id: "mock-release-1",
      repoName: "test-order-service",
      repoUrl: "https://github.com/octocat/test-order-service",
      type: "release",
      title: "v1.4.0",
      url: "https://github.com/octocat/test-order-service/releases/tag/v1.4.0",
      occurredAt: new Date(NOW - 6 * DAY).toISOString(),
    },
    {
      id: "mock-pr-2",
      repoName: "test-data-pipeline",
      repoUrl: "https://github.com/octocat/test-data-pipeline",
      type: "pull_request",
      title: "Backfill missing warehouse partitions",
      url: "https://github.com/octocat/test-data-pipeline/pull/7",
      occurredAt: new Date(NOW - 10 * DAY).toISOString(),
      state: "open",
    },
  ];
}
