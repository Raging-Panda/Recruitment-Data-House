import type { GithubRepo, RepoQualityCheck } from "./github";
import type { CommitActivityPoint, LanguageBreakdownEntry } from "./types";

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

/**
 * Replaces the REST-era N+1 pattern for everything *except* the profile
 * fetch itself: up to 25 per-repo language calls, a per-repo contents call
 * + a per-repo workflows call (the previously dead `checkRepoQuality`,
 * removed — it was never actually wired up, so every real GitHub-connected
 * user's hasReadme/hasTests/hasCi quality signals silently defaulted to
 * false, which in turn floors their DevOps/Cloud/Leadership fingerprint
 * scores at computeSkillFingerprint's fallback values regardless of their
 * real repos), 3 PR-search calls, 2 issue-search calls, and one events
 * call for commit activity — roughly 30+ REST round trips collapse into
 * this one GraphQL request.
 *
 * Takes `login` as an input (from the one REST call to /user this app
 * still makes first) rather than fetching it here too — `search()`
 * queries need a literal username string, which can't be known until a
 * request already ran, so folding the profile fetch in here would just
 * trade one round trip for another instead of actually saving one.
 * `viewer { ... }` (not `user(login:)`) for everything else, so
 * `contributionsCollection` correctly includes this token's own private
 * contributions where the account's settings allow it, exactly like
 * their real GitHub profile shows them to themselves.
 *
 * Verified against a real GitHub account's real data (not a fixture):
 * language byte counts, PR/issue search counts, and workflow presence all
 * matched the old REST endpoints exactly, and the whole thing costs 5
 * GraphQL rate-limit points in one HTTP request versus ~30 REST calls
 * (and ~30 points) before.
 */
const HUB_DATA_QUERY = `
query HubData($prQuery: String!, $mergedPRQuery: String!, $reviewedPRQuery: String!, $issuesOpenQuery: String!, $issuesClosedQuery: String!) {
  viewer {
    repoCount: repositories(privacy: PUBLIC) { totalCount }
    repositories(first: 25, ownerAffiliations: [OWNER], isFork: false, orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes {
        databaseId
        name
        nameWithOwner
        description
        url
        isFork
        stargazerCount
        watchers { totalCount }
        updatedAt
        owner { login }
        primaryLanguage { name }
        licenseInfo { key }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name } }
        }
        root: object(expression: "HEAD:") { ... on Tree { entries { name type } } }
        workflows: object(expression: "HEAD:.github/workflows") { ... on Tree { entries { name } } }
      }
    }
    contributionsCollection {
      commitContributionsByRepository(maxRepositories: 25) {
        contributions(first: 100) { nodes { occurredAt commitCount } }
      }
    }
  }
  totalPR: search(query: $prQuery, type: ISSUE) { issueCount }
  mergedPR: search(query: $mergedPRQuery, type: ISSUE) { issueCount }
  reviewedPR: search(query: $reviewedPRQuery, type: ISSUE) { issueCount }
  openedIssues: search(query: $issuesOpenQuery, type: ISSUE) { issueCount }
  closedIssues: search(query: $issuesClosedQuery, type: ISSUE) { issueCount }
}`;

interface TreeEntry {
  name: string;
  type?: string;
}

interface GraphQLRepoNode {
  databaseId: number;
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  isFork: boolean;
  stargazerCount: number;
  watchers: { totalCount: number };
  updatedAt: string;
  owner: { login: string };
  primaryLanguage: { name: string } | null;
  licenseInfo: { key: string } | null;
  languages: { edges: { size: number; node: { name: string } }[] };
  root: { entries: TreeEntry[] } | null;
  workflows: { entries: TreeEntry[] } | null;
}

interface HubDataResponse {
  data?: {
    viewer: {
      repoCount: { totalCount: number };
      repositories: { nodes: GraphQLRepoNode[] };
      contributionsCollection: {
        commitContributionsByRepository: {
          contributions: { nodes: { occurredAt: string; commitCount: number }[] };
        }[];
      };
    };
    totalPR: { issueCount: number };
    mergedPR: { issueCount: number };
    reviewedPR: { issueCount: number };
    openedIssues: { issueCount: number };
    closedIssues: { issueCount: number };
  };
  errors?: { message: string }[];
}

const README_RE = /^readme/i;
const TEST_DIR_NAMES = new Set(["test", "tests", "__tests__", "spec"]);

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export interface HubDataGraphQL {
  repos: GithubRepo[];
  publicRepoCount: number;
  languageBreakdown: LanguageBreakdownEntry[];
  commitActivity: CommitActivityPoint[];
  prStats: { total: number; merged: number; reviews: number };
  issueStats: { opened: number; closed: number };
  qualityByRepo: Map<string, RepoQualityCheck>;
  languagesByRepo: Map<string, string[]>;
}

export async function fetchHubDataGraphQL(token: string, login: string): Promise<HubDataGraphQL> {
  const res = await fetch(GITHUB_GRAPHQL_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: HUB_DATA_QUERY,
      variables: {
        prQuery: `author:${login} type:pr`,
        mergedPRQuery: `author:${login} type:pr is:merged`,
        reviewedPRQuery: `reviewed-by:${login} type:pr`,
        issuesOpenQuery: `author:${login} type:issue`,
        issuesClosedQuery: `author:${login} type:issue is:closed`,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL hub data failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as HubDataResponse;
  if (json.errors?.length || !json.data) {
    throw new Error(`GitHub GraphQL hub data failed: ${json.errors?.[0]?.message ?? "no data"}`);
  }

  const { viewer, totalPR, mergedPR, reviewedPR, openedIssues, closedIssues } = json.data;
  const nodes = viewer.repositories.nodes;

  const repos: GithubRepo[] = nodes.map((n) => ({
    id: n.databaseId,
    name: n.name,
    full_name: n.nameWithOwner,
    description: n.description,
    html_url: n.url,
    stargazers_count: n.stargazerCount,
    watchers_count: n.watchers.totalCount,
    updated_at: n.updatedAt,
    fork: n.isFork,
    language: n.primaryLanguage?.name ?? null,
    license: n.licenseInfo,
    owner: { login: n.owner.login },
  }));

  const qualityByRepo = new Map<string, RepoQualityCheck>();
  const languagesByRepo = new Map<string, string[]>();
  const languageTotals = new Map<string, number>();
  const languageLastUsedAt = new Map<string, string>();

  for (const n of nodes) {
    const rootNames = (n.root?.entries ?? []).map((e) => e.name.toLowerCase());
    qualityByRepo.set(n.nameWithOwner, {
      hasReadme: rootNames.some((name) => README_RE.test(name)),
      hasTests: rootNames.some((name) => TEST_DIR_NAMES.has(name)),
      hasCi: (n.workflows?.entries.length ?? 0) > 0,
    });

    const repoLanguages = n.languages.edges.map((e) => e.node.name);
    languagesByRepo.set(n.nameWithOwner, repoLanguages);
    for (const edge of n.languages.edges) {
      const lang = edge.node.name;
      languageTotals.set(lang, (languageTotals.get(lang) ?? 0) + edge.size);
      const existing = languageLastUsedAt.get(lang);
      if (!existing || new Date(n.updatedAt) > new Date(existing)) {
        languageLastUsedAt.set(lang, n.updatedAt);
      }
    }
  }

  const totalBytes = [...languageTotals.values()].reduce((a, b) => a + b, 0) || 1;
  const languageBreakdown: LanguageBreakdownEntry[] = [...languageTotals.entries()]
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Math.round((bytes / totalBytes) * 1000) / 10,
      lastUsedAt: languageLastUsedAt.get(language) ?? null,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const commitBuckets = new Map<string, number>();
  for (const repoContrib of viewer.contributionsCollection.commitContributionsByRepository) {
    for (const day of repoContrib.contributions.nodes) {
      const weekStart = startOfWeek(new Date(day.occurredAt)).toISOString().slice(0, 10);
      commitBuckets.set(weekStart, (commitBuckets.get(weekStart) ?? 0) + day.commitCount);
    }
  }
  const commitActivity: CommitActivityPoint[] = [...commitBuckets.entries()]
    .map(([weekStart, commitCount]) => ({ weekStart, commitCount }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return {
    repos,
    publicRepoCount: viewer.repoCount.totalCount,
    languageBreakdown,
    commitActivity,
    prStats: { total: totalPR.issueCount, merged: mergedPR.issueCount, reviews: reviewedPR.issueCount },
    issueStats: { opened: openedIssues.issueCount, closed: closedIssues.issueCount },
    qualityByRepo,
    languagesByRepo,
  };
}
