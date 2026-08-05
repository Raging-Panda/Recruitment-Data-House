import { useEffect, useState } from "react";
import {
  buildLanguageBreakdown,
  computeSkillFingerprint,
  deriveAnalyticsSnapshot,
  fetchGithubRepos,
  fetchGithubUser,
  fetchIssueStats,
  fetchPullRequestStats,
  fetchRecentCommitActivity,
  reposToProjects,
  type AnalyticsSnapshot,
  type DeveloperActivitySummary,
  type DeveloperProfile,
  type DeveloperProject,
  type SkillFingerprint,
} from "@ipskill/shared";
import { useAuth } from "./auth-context";

export interface DeveloperHubData {
  profile: DeveloperProfile;
  skillFingerprint: SkillFingerprint;
  projects: DeveloperProject[];
  activity: DeveloperActivitySummary;
  analytics: AnalyticsSnapshot;
}

export function useDeveloperHubData() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<DeveloperHubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
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

        if (cancelled) return;
        setData({
          profile,
          skillFingerprint,
          projects: reposToProjects(repos, new Map(), new Map()),
          activity,
          analytics: deriveAnalyticsSnapshot({
            followers: user.followers,
            publicRepoCount: user.public_repos,
          }),
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load GitHub data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { data, isLoading, error };
}
