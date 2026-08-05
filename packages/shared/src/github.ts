import type {
  DeveloperActivitySummary,
  DeveloperProject,
  LanguageBreakdownEntry,
  SkillFingerprint,
} from "./types";

const GITHUB_API = "https://api.github.com";

async function githubFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface GithubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  followers: number;
  public_repos: number;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  updated_at: string;
  fork: boolean;
  language: string | null;
  license: { key: string } | null;
  owner: { login: string };
}

export async function fetchGithubUser(token: string): Promise<GithubUser> {
  return githubFetch<GithubUser>(token, "/user");
}

export async function fetchGithubRepos(token: string): Promise<GithubRepo[]> {
  return githubFetch<GithubRepo[]>(
    token,
    "/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator"
  );
}

export async function fetchRepoLanguages(
  token: string,
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  return githubFetch<Record<string, number>>(token, `/repos/${owner}/${repo}/languages`);
}

interface RepoQualityCheck {
  hasReadme: boolean;
  hasCi: boolean;
  hasTests: boolean;
}

async function checkRepoQuality(
  token: string,
  owner: string,
  repo: string
): Promise<RepoQualityCheck> {
  const [contents, workflows] = await Promise.all([
    githubFetch<{ name: string }[]>(token, `/repos/${owner}/${repo}/contents`).catch(() => []),
    githubFetch<{ workflows: unknown[] }>(token, `/repos/${owner}/${repo}/actions/workflows`)
      .then((r) => r.workflows.length > 0)
      .catch(() => false),
  ]);
  const names = contents.map((c) => c.name.toLowerCase());
  return {
    hasReadme: names.some((n) => n.startsWith("readme")),
    hasTests: names.some((n) => n === "test" || n === "tests" || n === "__tests__" || n === "spec"),
    hasCi: workflows as boolean,
  };
}

export async function buildLanguageBreakdown(
  token: string,
  repos: GithubRepo[]
): Promise<LanguageBreakdownEntry[]> {
  const nonForks = repos.filter((r) => !r.fork).slice(0, 25);
  const perRepo = await Promise.all(
    nonForks.map((r) =>
      fetchRepoLanguages(token, r.owner.login, r.name).catch(() => ({}) as Record<string, number>)
    )
  );

  const totals = new Map<string, number>();
  for (const langs of perRepo) {
    for (const [lang, bytes] of Object.entries(langs)) {
      totals.set(lang, (totals.get(lang) ?? 0) + bytes);
    }
  }

  const totalBytes = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  return [...totals.entries()]
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Math.round((bytes / totalBytes) * 1000) / 10,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

interface GithubSearchResult {
  total_count: number;
}

export async function fetchPullRequestStats(
  token: string,
  login: string
): Promise<{ total: number; merged: number; reviews: number }> {
  const [total, merged, reviews] = await Promise.all([
    githubFetch<GithubSearchResult>(token, `/search/issues?q=author:${login}+type:pr`),
    githubFetch<GithubSearchResult>(
      token,
      `/search/issues?q=author:${login}+type:pr+is:merged`
    ),
    githubFetch<GithubSearchResult>(
      token,
      `/search/issues?q=reviewed-by:${login}+type:pr`
    ),
  ]);
  return { total: total.total_count, merged: merged.total_count, reviews: reviews.total_count };
}

export async function fetchIssueStats(
  token: string,
  login: string
): Promise<{ opened: number; closed: number }> {
  const [opened, closed] = await Promise.all([
    githubFetch<GithubSearchResult>(token, `/search/issues?q=author:${login}+type:issue`),
    githubFetch<GithubSearchResult>(
      token,
      `/search/issues?q=author:${login}+type:issue+is:closed`
    ),
  ]);
  return { opened: opened.total_count, closed: closed.total_count };
}

interface GithubEvent {
  type: string;
  created_at: string;
  payload?: { commits?: unknown[] };
}

export async function fetchRecentCommitActivity(
  token: string,
  login: string
): Promise<{ weekStart: string; commitCount: number }[]> {
  const events = await githubFetch<GithubEvent[]>(token, `/users/${login}/events/public`);
  const buckets = new Map<string, number>();

  for (const event of events) {
    if (event.type !== "PushEvent") continue;
    const commitCount = event.payload?.commits?.length ?? 0;
    const date = new Date(event.created_at);
    const weekStart = startOfWeek(date).toISOString().slice(0, 10);
    buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + commitCount);
  }

  return [...buckets.entries()]
    .map(([weekStart, commitCount]) => ({ weekStart, commitCount }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function reposToProjects(
  repos: GithubRepo[],
  quality: Map<string, RepoQualityCheck>,
  languagesByRepo: Map<string, string[]>
): DeveloperProject[] {
  return repos
    .filter((r) => !r.fork)
    .map((r) => {
      const q = quality.get(r.full_name);
      return {
        id: String(r.id),
        name: r.name,
        description: r.description,
        languages: languagesByRepo.get(r.full_name) ?? (r.language ? [r.language] : []),
        stars: r.stargazers_count,
        watchers: r.watchers_count,
        updatedAt: r.updated_at,
        url: r.html_url,
        quality: {
          hasTests: q?.hasTests ?? false,
          hasReadme: q?.hasReadme ?? false,
          hasCi: q?.hasCi ?? false,
          hasLicense: r.license !== null,
        },
        category: r.stargazers_count >= 10 ? "Featured" : "Personal",
      } satisfies DeveloperProject;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

const LANGUAGE_CATEGORY_MAP: Record<string, "Backend" | "Frontend" | "Database"> = {
  "C#": "Backend",
  Java: "Backend",
  Go: "Backend",
  Python: "Backend",
  Ruby: "Backend",
  PHP: "Backend",
  Rust: "Backend",
  JavaScript: "Frontend",
  TypeScript: "Frontend",
  HTML: "Frontend",
  CSS: "Frontend",
  Vue: "Frontend",
  Svelte: "Frontend",
  SQL: "Database",
  PLpgSQL: "Database",
};

export function computeSkillFingerprint(
  languages: LanguageBreakdownEntry[],
  activity: Pick<DeveloperActivitySummary, "codeReviews" | "mergedPullRequests">,
  qualitySignals: RepoQualityCheck[]
): SkillFingerprint {
  const languagePct = (category: string) =>
    Math.min(
      100,
      languages
        .filter((l) => LANGUAGE_CATEGORY_MAP[l.language] === category)
        .reduce((sum, l) => sum + l.percentage, 0) * 1.4
    );

  const ciAdoption = qualitySignals.length
    ? qualitySignals.filter((q) => q.hasCi).length / qualitySignals.length
    : 0;
  const testAdoption = qualitySignals.length
    ? qualitySignals.filter((q) => q.hasTests).length / qualitySignals.length
    : 0;

  return {
    Backend: Math.round(languagePct("Backend")) || 20,
    Frontend: Math.round(languagePct("Frontend")) || 20,
    Database: Math.round(languagePct("Database")) || 15,
    DevOps: Math.round(ciAdoption * 100) || 10,
    Cloud: Math.round(ciAdoption * 80) || 10,
    "Problem Solving": Math.round(Math.min(100, activity.mergedPullRequests * 5)) || 20,
    Communication: Math.round(Math.min(100, activity.codeReviews * 8)) || 20,
    Leadership: Math.round(Math.min(100, testAdoption * 100)) || 15,
  };
}
