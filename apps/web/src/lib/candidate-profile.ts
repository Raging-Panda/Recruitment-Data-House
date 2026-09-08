import type { CandidateProfileOverride } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_PROFILE_OVERRIDE } from "@/lib/demo-data";

interface CandidateProfileRow {
  github_id: string;
  display_name: string | null;
  about_authored: string | null;
  currently: string | null;
  currently_updated_at: string | null;
  updated_at: string;
}

function rowToOverride(row: CandidateProfileRow): CandidateProfileOverride | null {
  // A row can exist purely to carry other per-account flags (e.g. plan)
  // without any of the developer-facing fields being set — nothing to
  // layer on top of the GitHub profile in that case.
  if (!row.display_name && !row.about_authored && !row.currently) return null;
  return {
    githubId: row.github_id,
    displayName: row.display_name,
    aboutAuthored: row.about_authored,
    currently: row.currently,
    currentlyUpdatedAt: row.currently_updated_at,
    updatedAt: row.updated_at,
  };
}

const SELECT = "github_id, display_name, about_authored, currently, currently_updated_at, updated_at";

export async function getCandidateProfileOverride(
  githubId: string
): Promise<CandidateProfileOverride | null> {
  if (isDemoAccount(githubId)) return DEMO_PROFILE_OVERRIDE;

  const { data, error } = await getSupabaseAdmin()
    .from("candidate_profile")
    .select(SELECT)
    .eq("github_id", githubId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToOverride(data as CandidateProfileRow) : null;
}

/**
 * Same lookup, but for call sites where the override is a nice-to-have
 * layered on top of the GitHub-derived data rather than the page's whole
 * reason for existing (the dashboard shell, the profile header) — a
 * Supabase hiccup there shouldn't 500 the entire dashboard, just fall back
 * to the un-overridden GitHub values.
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
