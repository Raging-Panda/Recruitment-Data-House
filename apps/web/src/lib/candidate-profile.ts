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
