import { getSupabaseAdmin } from "@/lib/supabase";

interface CacheRow {
  payload: unknown;
  fetched_at: string;
}

/**
 * Read-through cache for GitHub API fan-outs, keyed by "<github_id>:<kind>".
 * Every dashboard page (Profile, Skills, Projects, Analytics) independently
 * calls loadDeveloperHubData, and GitHub's REST rate limit (5,000 req/hr per
 * token) plus per-repo fan-out (languages/commits/PRs) makes refetching on
 * every nav expensive — a stale-while-under-TTL cache means only the first
 * load in a window pays the full GitHub API cost. Returns null (cache miss)
 * on any Supabase error so a hiccup here degrades to a live fetch rather
 * than breaking the page.
 */
export async function readGithubCache<T>(
  githubId: string,
  kind: string,
  ttlMs: number
): Promise<T | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("github_data_cache")
      .select("payload, fetched_at")
      .eq("cache_key", `${githubId}:${kind}`)
      .maybeSingle<CacheRow>();
    if (error || !data) return null;
    const age = Date.now() - new Date(data.fetched_at).getTime();
    if (age > ttlMs) return null;
    return data.payload as T;
  } catch {
    return null;
  }
}

export async function writeGithubCache(
  githubId: string,
  kind: string,
  payload: unknown
): Promise<void> {
  try {
    await getSupabaseAdmin()
      .from("github_data_cache")
      .upsert({
        cache_key: `${githubId}:${kind}`,
        github_id: githubId,
        payload,
        fetched_at: new Date().toISOString(),
      });
  } catch {
    // caching is a performance optimization, not worth failing the page over
  }
}
