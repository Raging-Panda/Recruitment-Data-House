import { useEffect, useState } from "react";
import {
  computeSkillFingerprint,
  deriveAnalyticsSnapshot,
  fetchGithubUser,
  fetchHubDataGraphQL,
  reposToProjects,
  type AnalyticsSnapshot,
  type DeveloperActivitySummary,
  type DeveloperProfile,
  type DeveloperProject,
  type SkillFingerprint,
} from "@ipskill/shared";
import { useAuth } from "./auth-context";
import { getCachedHubData, setCachedHubData } from "./hub-data-cache";

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

    const cached = getCachedHubData(accessToken);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const user = await fetchGithubUser(accessToken);
        const hub = await fetchHubDataGraphQL(accessToken, user.login);

        const activity: DeveloperActivitySummary = {
          languageBreakdown: hub.languageBreakdown,
          commitActivity: hub.commitActivity,
          totalPullRequests: hub.prStats.total,
          mergedPullRequests: hub.prStats.merged,
          codeReviews: hub.prStats.reviews,
          issuesOpened: hub.issueStats.opened,
          issuesClosed: hub.issueStats.closed,
          publicRepoCount: hub.publicRepoCount,
          followers: user.followers,
        };

        const skillFingerprint = computeSkillFingerprint(
          hub.languageBreakdown,
          { codeReviews: hub.prStats.reviews, mergedPullRequests: hub.prStats.merged },
          [...hub.qualityByRepo.values()]
        );

        const overallScore = Math.round(
          Object.values(skillFingerprint).reduce((sum, v) => sum + v, 0) /
            Object.values(skillFingerprint).length
        );

        const profile: DeveloperProfile = {
          id: user.login,
          name: user.name ?? user.login,
          headline: hub.repos[0]?.language ? `${hub.repos[0].language} Developer` : "Full Stack Developer",
          location: user.location,
          avatarUrl: user.avatar_url,
          githubLogin: user.login,
          availableForOpportunities: true,
          overallScore,
          percentileRank: Math.max(1, Math.round(100 - overallScore * 0.9)),
          about: user.bio,
          joinedGithubAt: user.created_at,
        };

        if (cancelled) return;
        const hubData: DeveloperHubData = {
          profile,
          skillFingerprint,
          projects: reposToProjects(hub.repos, hub.qualityByRepo, hub.languagesByRepo),
          activity,
          analytics: deriveAnalyticsSnapshot({
            followers: user.followers,
            publicRepoCount: hub.publicRepoCount,
          }),
        };
        setCachedHubData(accessToken, hubData);
        setData(hubData);
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
