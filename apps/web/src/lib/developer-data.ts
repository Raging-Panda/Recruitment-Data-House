import {
  buildActivityTimeline,
  buildLanguageBreakdown,
  computeSkillFingerprint,
  deriveAnalyticsSnapshot,
  fetchContributionCalendar,
  fetchGithubRepos,
  fetchGithubUser,
  fetchIssueStats,
  fetchPullRequestStats,
  fetchRecentCommitActivity,
  reposToProjects,
  type ContributionDay,
  type DeveloperActivitySummary,
  type DeveloperProfile,
  type DeveloperProject,
  type RepoActivityEvent,
  type SkillFingerprint,
} from "@ipskill/shared";
import { TEST_ACCESS_TOKEN } from "./test-mode";
import { buildMockDeveloperHubData, buildMockActivityTimeline, buildMockContributionCalendar } from "./mock-developer-data";
import { DEMO_ACCESS_TOKEN } from "./demo-mode";
import { buildDemoDeveloperHubData, buildDemoActivityTimeline, buildDemoContributionCalendar } from "./demo-data";
import { readGithubCache, writeGithubCache } from "./github-cache";

// Hub summary (profile/skills/analytics) feels stale faster than raw repo
// history, so it gets a shorter TTL than the timeline, which costs far more
// GitHub API calls (up to 6 repos x 3 endpoints) to rebuild.
const HUB_CACHE_TTL_MS = 10 * 60 * 1000;
const TIMELINE_CACHE_TTL_MS = 30 * 60 * 1000;
// A contribution calendar changes at most once a day per square, so this
// can sit far longer than the hub summary without feeling stale.
const HEATMAP_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export interface DeveloperHubData {
  profile: DeveloperProfile;
  skillFingerprint: SkillFingerprint;
  projects: DeveloperProject[];
  activity: DeveloperActivitySummary;
  analytics: ReturnType<typeof deriveAnalyticsSnapshot>;
}

export async function loadDeveloperHubData(
  accessToken: string,
  githubId: string
): Promise<DeveloperHubData> {
  if (accessToken === TEST_ACCESS_TOKEN) return buildMockDeveloperHubData();
  if (accessToken === DEMO_ACCESS_TOKEN) return buildDemoDeveloperHubData();

  const cached = await readGithubCache<DeveloperHubData>(githubId, "hub", HUB_CACHE_TTL_MS);
  if (cached) return cached;

  const [user, repos] = await Promise.all([
    fetchGithubUser(accessToken),
    fetchGithubRepos(accessToken),
  ]);

  const [languageBreakdown, prStats, issueStats, commitActivity] = await Promise.all([
    buildLanguageBreakdown(accessToken, repos),
    fetchPullRequestStats(accessToken, user.login),
    fetchIssueStats(accessToken, user.login),
    fetchRecentCommitActivity(accessToken, user.login),
  ]);

  const activity: DeveloperActivitySummary = {
    languageBreakdown,
    commitActivity,
    totalPullRequests: prStats.total,
    mergedPullRequests: prStats.merged,
    codeReviews: prStats.reviews,
    issuesOpened: issueStats.opened,
    issuesClosed: issueStats.closed,
    publicRepoCount: user.public_repos,
    followers: user.followers,
  };

  const skillFingerprint = computeSkillFingerprint(
    languageBreakdown,
    { codeReviews: prStats.reviews, mergedPullRequests: prStats.merged },
    []
  );

  const projects = reposToProjects(repos, new Map(), new Map());

  const overallScore = Math.round(
    Object.values(skillFingerprint).reduce((sum, v) => sum + v, 0) /
      Object.values(skillFingerprint).length
  );

  const profile: DeveloperProfile = {
    id: user.login,
    name: user.name ?? user.login,
    headline: repos[0]?.language ? `${repos[0].language} Developer` : "Full Stack Developer",
    location: user.location,
    avatarUrl: user.avatar_url,
    githubLogin: user.login,
    availableForOpportunities: true,
    overallScore,
    percentileRank: Math.max(1, Math.round(100 - overallScore * 0.9)),
    about: user.bio,
  };

  const result: DeveloperHubData = {
    profile,
    skillFingerprint,
    projects,
    activity,
    analytics: deriveAnalyticsSnapshot({
      followers: user.followers,
      publicRepoCount: user.public_repos,
    }),
  };

  await writeGithubCache(githubId, "hub", result);
  return result;
}

/**
 * Separate from loadDeveloperHubData: this adds several more GitHub API
 * calls (commits/PRs/releases per repo), so it's only paid for on the
 * Projects page rather than on every dashboard page load.
 */
export async function loadProjectActivityTimeline(
  accessToken: string,
  githubId: string
): Promise<RepoActivityEvent[]> {
  if (accessToken === TEST_ACCESS_TOKEN) return buildMockActivityTimeline();
  if (accessToken === DEMO_ACCESS_TOKEN) return buildDemoActivityTimeline();

  const cached = await readGithubCache<RepoActivityEvent[]>(
    githubId,
    "timeline",
    TIMELINE_CACHE_TTL_MS
  );
  if (cached) return cached;

  const repos = await fetchGithubRepos(accessToken);
  const timeline = await buildActivityTimeline(accessToken, repos);
  await writeGithubCache(githubId, "timeline", timeline);
  return timeline;
}

/**
 * Separate from loadDeveloperHubData for the same reason as the timeline
 * above: it's an extra GitHub call (GraphQL, not REST) only the Profile
 * page needs, not every dashboard page. Takes login rather than
 * re-fetching /user, since the caller already has it from
 * loadDeveloperHubData's result.
 */
export async function loadContributionCalendar(
  accessToken: string,
  githubId: string,
  login: string
): Promise<ContributionDay[]> {
  if (accessToken === TEST_ACCESS_TOKEN) return buildMockContributionCalendar();
  if (accessToken === DEMO_ACCESS_TOKEN) return buildDemoContributionCalendar();

  const cached = await readGithubCache<ContributionDay[]>(githubId, "heatmap", HEATMAP_CACHE_TTL_MS);
  if (cached) return cached;

  const days = await fetchContributionCalendar(accessToken, login);
  await writeGithubCache(githubId, "heatmap", days);
  return days;
}
