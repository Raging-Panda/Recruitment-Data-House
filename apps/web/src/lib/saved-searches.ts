import type { DirectoryEntry, DirectoryFilters, SavedSearch } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { matchesDirectoryFilters } from "@/lib/directory-filters";
import { createNotification } from "@/lib/notifications";

interface SavedSearchRow {
  id: string;
  name: string;
  filters: DirectoryFilters;
  created_at: string;
}

function rowToSavedSearch(row: SavedSearchRow): SavedSearch {
  return { id: row.id, name: row.name, filters: row.filters, createdAt: row.created_at };
}

export async function listSavedSearches(ownerGithubId: string): Promise<SavedSearch[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("saved_searches")
    .select("id, name, filters, created_at")
    .eq("owner_github_id", ownerGithubId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as SavedSearchRow[]).map(rowToSavedSearch);
}

export async function createSavedSearch(
  ownerGithubId: string,
  name: string,
  filters: DirectoryFilters
): Promise<SavedSearch> {
  const { data, error } = await getSupabaseAdmin()
    .from("saved_searches")
    .insert({ owner_github_id: ownerGithubId, name, filters })
    .select("id, name, filters, created_at")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("You already have a saved search with that name.");
    throw new Error(error.message);
  }
  return rowToSavedSearch(data);
}

export async function deleteSavedSearch(ownerGithubId: string, savedSearchId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("saved_searches")
    .delete()
    .eq("id", savedSearchId)
    .eq("owner_github_id", ownerGithubId);

  if (error) throw new Error(error.message);
}

/**
 * Called whenever a candidate's directory profile is synced (see
 * syncDirectoryProfile). Finds every saved search — other than the
 * candidate's own — whose filters now match this candidate, and notifies
 * the owner exactly once per (search, candidate) pair via the
 * saved_search_matches dedupe ledger, so revisiting your own Profile page
 * (which re-syncs on every load) doesn't re-notify the same recruiter
 * repeatedly. Best-effort: this must never fail the profile sync it rides
 * along with.
 */
export async function notifySavedSearchMatches(candidate: DirectoryEntry): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: searches, error } = await supabase
      .from("saved_searches")
      .select("id, name, owner_github_id, filters")
      .neq("owner_github_id", candidate.githubId);
    if (error || !searches || searches.length === 0) return;

    const matching = searches.filter((s) =>
      matchesDirectoryFilters(candidate, s.filters as DirectoryFilters)
    );
    if (matching.length === 0) return;

    const { data: newMatches, error: upsertError } = await supabase
      .from("saved_search_matches")
      .upsert(
        matching.map((s) => ({ saved_search_id: s.id, candidate_github_id: candidate.githubId })),
        { onConflict: "saved_search_id,candidate_github_id", ignoreDuplicates: true }
      )
      .select("saved_search_id");
    if (upsertError || !newMatches) return;

    const newSearchIds = new Set(newMatches.map((m) => m.saved_search_id as string));
    await Promise.all(
      matching
        .filter((s) => newSearchIds.has(s.id))
        .map((s) =>
          createNotification(s.owner_github_id, {
            type: "saved_search_match",
            title: `New match for "${s.name}"`,
            body: `${candidate.displayName} now matches your saved search.`,
            link: `/dashboard/directory/${candidate.githubId}`,
          })
        )
    );
  } catch {
    // saved-search alerts are a nice-to-have side effect, not worth failing the profile sync over
  }
}
