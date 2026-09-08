import type { DirectoryEntry, DirectoryFilters } from "@ipskill/shared";

export const DEFAULT_DIRECTORY_FILTERS: DirectoryFilters = {
  search: "",
  location: "all",
  language: "all",
  minScore: 0,
  availableOnly: false,
};

/**
 * Single source of truth for "does this candidate match these filters" —
 * used by the Directory browser to filter the live list on the client, and
 * by saved-search matching to decide whether a newly-synced candidate
 * should trigger a notification. Keeping one implementation means a saved
 * search always matches exactly what re-running it in the browser would
 * show.
 */
/** Builds the Directory URL that re-runs a saved search's filters. */
export function directoryUrlForFilters(filters: DirectoryFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.location !== "all") params.set("location", filters.location);
  if (filters.language !== "all") params.set("language", filters.language);
  if (filters.minScore > 0) params.set("minScore", String(filters.minScore));
  if (filters.availableOnly) params.set("availableOnly", "true");
  const query = params.toString();
  return query ? `/dashboard/recruiter/directory?${query}` : "/dashboard/recruiter/directory";
}

/** Human-readable one-liner for a saved search card, e.g. "Go · Cape Town · 70%+ · Open to opportunities". */
export function summarizeFilters(filters: DirectoryFilters): string {
  const parts: string[] = [];
  if (filters.language !== "all") parts.push(filters.language);
  if (filters.location !== "all") parts.push(filters.location);
  if (filters.minScore > 0) parts.push(`${filters.minScore}%+`);
  if (filters.availableOnly) parts.push("Open to opportunities");
  if (filters.search) parts.push(`"${filters.search}"`);
  return parts.length > 0 ? parts.join(" · ") : "All developers";
}

export function matchesDirectoryFilters(entry: DirectoryEntry, filters: DirectoryFilters): boolean {
  if (filters.availableOnly && !entry.availableForOpportunities) return false;
  if (entry.overallScore < filters.minScore) return false;
  if (filters.location !== "all" && entry.location !== filters.location) return false;
  if (filters.language !== "all" && !entry.topLanguages.includes(filters.language)) return false;
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    const haystack = [entry.displayName, entry.headline, entry.location, ...entry.topLanguages]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}
