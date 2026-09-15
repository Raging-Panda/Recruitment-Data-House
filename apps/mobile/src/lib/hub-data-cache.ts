import type { DeveloperHubData } from "./use-developer-hub-data";

/**
 * Lightweight in-memory cache for the hub data fetch — replaces the ad hoc
 * "refetch every screen focus" behavior without pulling in React Query/SWR
 * (no new dependency, matching this app's minimal-deps style; the web
 * side's equivalent is lib/github-cache.ts, a Supabase-backed version of
 * the same TTL idea). Keyed by access token since that's what identifies
 * "whose data this is" here; cleared on logout by simply going out of
 * scope (module-level, not persisted).
 */
const TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  data: DeveloperHubData;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedHubData(accessToken: string): DeveloperHubData | null {
  const entry = cache.get(accessToken);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    cache.delete(accessToken);
    return null;
  }
  return entry.data;
}

export function setCachedHubData(accessToken: string, data: DeveloperHubData): void {
  cache.set(accessToken, { data, fetchedAt: Date.now() });
}

export function invalidateHubDataCache(accessToken: string): void {
  cache.delete(accessToken);
}
