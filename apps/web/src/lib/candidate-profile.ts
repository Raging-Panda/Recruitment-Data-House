import type { CandidateProfileOverride } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";

interface CandidateProfileRow {
  github_id: string;
  display_name: string;
  updated_at: string;
}

function rowToOverride(row: CandidateProfileRow): CandidateProfileOverride {
  return {
    githubId: row.github_id,
    displayName: row.display_name,
    updatedAt: row.updated_at,
  };
}

export async function getCandidateProfileOverride(
  githubId: string
): Promise<CandidateProfileOverride | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("candidate_profile")
    .select("*")
    .eq("github_id", githubId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToOverride(data) : null;
}

/**
 * Same lookup, but for call sites where the display name is a nice-to-have
 * layered on top of the GitHub-derived name rather than the page's whole
 * reason for existing (the dashboard shell, the profile header) — a
 * Supabase hiccup there shouldn't 500 the entire dashboard, just fall back
 * to the un-overridden name.
 */
export async function getCandidateProfileOverrideSafe(
  githubId: string
): Promise<CandidateProfileOverride | null> {
  try {
    return await getCandidateProfileOverride(githubId);
  } catch {
    return null;
  }
}
