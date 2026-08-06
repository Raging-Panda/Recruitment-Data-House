import {
  buildActivityTimeline,
  buildLanguageBreakdown,
  computeSkillFingerprint,
  deriveAnalyticsSnapshot,
  fetchGithubRepos,
  fetchGithubUser,
  fetchIssueStats,
  fetchPullRequestStats,
  fetchRecentCommitActivity,
  reposToProjects,
  type DeveloperActivitySummary,
  type DeveloperProfile,
  type DeveloperProject,
  type SkillFingerprint,
} from "@ipskill/shared";
import { TEST_ACCESS_TOKEN } from "./test-mode";
import { buildMockDeveloperHubData, buildMockActivityTimeline } from "./mock-developer-data";

export interface DeveloperHubData {
  profile: DeveloperProfile;
  skillFingerprint: SkillFingerprint;
  projects: DeveloperProject[];
  activity: DeveloperActivitySummary;
  analytics: ReturnType<typeof deriveAnalyticsSnapshot>;
}

export async function loadDeveloperHubData(accessToken: string): Promise<DeveloperHubData> {
  if (accessToken === TEST_ACCESS_TOKEN) return buildMockDeveloperHubData();

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

  return {
    profile,
    skillFingerprint,
    projects,
    activity,
    analytics: deriveAnalyticsSnapshot({
      followers: user.followers,
      publicRepoCount: user.public_repos,
    }),
  };
}

/**
 * Separate from loadDeveloperHubData: this adds several more GitHub API
 * calls (commits/PRs/releases per repo), so it's only paid for on the
 * Projects page rather than on every dashboard page load.
 */
export async function loadProjectActivityTimeline(accessToken: string) {
  if (accessToken === TEST_ACCESS_TOKEN) return buildMockActivityTimeline();

  const repos = await fetchGithubRepos(accessToken);
  return buildActivityTimeline(accessToken, repos);
}
