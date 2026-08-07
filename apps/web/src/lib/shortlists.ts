import type { DirectoryEntry, Shortlist, ShortlistWithCandidates } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToDirectoryEntry, type DirectoryRow } from "@/lib/directory";

interface ShortlistRow {
  id: string;
  name: string;
  created_at: string;
  shortlist_candidates: { count: number }[];
}

function rowToShortlist(row: ShortlistRow): Shortlist {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    candidateCount: row.shortlist_candidates?.[0]?.count ?? 0,
  };
}

export async function listShortlists(ownerGithubId: string): Promise<Shortlist[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("shortlists")
    .select("id, name, created_at, shortlist_candidates(count)")
    .eq("owner_github_id", ownerGithubId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ShortlistRow[]).map(rowToShortlist);
}

export async function createShortlist(ownerGithubId: string, name: string): Promise<Shortlist> {
  const { data, error } = await getSupabaseAdmin()
    .from("shortlists")
    .insert({ owner_github_id: ownerGithubId, name })
    .select("id, name, created_at")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("You already have a shortlist with that name.");
    throw new Error(error.message);
  }
  return { id: data.id, name: data.name, createdAt: data.created_at, candidateCount: 0 };
}

export async function deleteShortlist(ownerGithubId: string, shortlistId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("shortlists")
    .delete()
    .eq("id", shortlistId)
    .eq("owner_github_id", ownerGithubId);

  if (error) throw new Error(error.message);
}

async function assertOwnsShortlist(ownerGithubId: string, shortlistId: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("shortlists")
    .select("id")
    .eq("id", shortlistId)
    .eq("owner_github_id", ownerGithubId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Shortlist not found");
}

/** Returns whether the candidate was newly added (false if they were already on the list). */
export async function addCandidateToShortlist(
  ownerGithubId: string,
  shortlistId: string,
  candidateGithubId: string
): Promise<boolean> {
  await assertOwnsShortlist(ownerGithubId, shortlistId);

  const { data, error } = await getSupabaseAdmin()
    .from("shortlist_candidates")
    .upsert(
      { shortlist_id: shortlistId, candidate_github_id: candidateGithubId },
      { onConflict: "shortlist_id,candidate_github_id", ignoreDuplicates: true }
    )
    .select("id");

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function removeCandidateFromShortlist(
  ownerGithubId: string,
  shortlistId: string,
  candidateGithubId: string
): Promise<void> {
  await assertOwnsShortlist(ownerGithubId, shortlistId);

  const { error } = await getSupabaseAdmin()
    .from("shortlist_candidates")
    .delete()
    .eq("shortlist_id", shortlistId)
    .eq("candidate_github_id", candidateGithubId);

  if (error) throw new Error(error.message);
}

export async function getShortlistWithCandidates(
  ownerGithubId: string,
  shortlistId: string
): Promise<ShortlistWithCandidates | null> {
  const supabase = getSupabaseAdmin();
  const { data: shortlist, error } = await supabase
    .from("shortlists")
    .select("id, name, created_at")
    .eq("id", shortlistId)
    .eq("owner_github_id", ownerGithubId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!shortlist) return null;

  const { data: members, error: memberError } = await supabase
    .from("shortlist_candidates")
    .select("candidate_github_id")
    .eq("shortlist_id", shortlistId);

  if (memberError) throw new Error(memberError.message);

  const candidateIds = (members ?? []).map((m) => m.candidate_github_id as string);
  let candidates: DirectoryEntry[] = [];
  if (candidateIds.length > 0) {
    const { data: rows, error: rowsError } = await supabase
      .from("directory_profiles")
      .select("*")
      .in("github_id", candidateIds);
    if (rowsError) throw new Error(rowsError.message);
    candidates = (rows as DirectoryRow[]).map(rowToDirectoryEntry);
  }

  return {
    id: shortlist.id,
    name: shortlist.name,
    createdAt: shortlist.created_at,
    candidateCount: candidates.length,
    candidates,
  };
}
