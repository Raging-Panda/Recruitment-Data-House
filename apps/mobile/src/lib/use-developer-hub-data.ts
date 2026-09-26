import { useQuery } from "@tanstack/react-query";
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

export interface DeveloperHubData {
  profile: DeveloperProfile;
  skillFingerprint: SkillFingerprint;
  projects: DeveloperProject[];
  activity: DeveloperActivitySummary;
  analytics: AnalyticsSnapshot;
}

async function loadHubData(accessToken: string): Promise<DeveloperHubData> {
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

  return {
    profile,
    skillFingerprint,
    projects: reposToProjects(hub.repos, hub.qualityByRepo, hub.languagesByRepo),
    activity,
    analytics: deriveAnalyticsSnapshot({
      followers: user.followers,
      publicRepoCount: hub.publicRepoCount,
    }),
  };
}

export function hubDataQueryKey(accessToken: string | null) {
  return ["hub-data", accessToken] as const;
}

/**
 * React Query replaces the old ad hoc useEffect fetch + hand-rolled TTL
 * cache: data now survives screen focus/unmount, revalidates in the
 * background on refocus/reconnect instead of blanking to a loading state,
 * and still isn't refetched from scratch every time a screen mounts.
 */
export function useDeveloperHubData() {
  const { accessToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: hubDataQueryKey(accessToken),
    queryFn: () => loadHubData(accessToken as string),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    data: data ?? null,
    isLoading: !!accessToken && isLoading,
    error: error instanceof Error ? error.message : error ? "Failed to load GitHub data" : null,
  };
}
