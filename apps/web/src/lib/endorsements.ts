import type { Endorsement, SkillCategory } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDirectoryEntriesByIds } from "@/lib/directory";

interface EndorsementRow {
  id: string;
  endorser_github_id: string;
  endorsee_github_id: string;
  skill_category: SkillCategory;
  comment: string | null;
  created_at: string;
}

/**
 * Endorser display info is resolved from directory_profiles rather than
 * stored on the endorsement row — there's no FK requiring an endorser to
 * already have a directory snapshot (visiting their own Profile page is
 * what creates one), so a missing entry falls back to a generic label
 * instead of breaking the list.
 */
export async function getEndorsementsFor(githubId: string): Promise<Endorsement[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("endorsements")
    .select("*")
    .eq("endorsee_github_id", githubId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = data as EndorsementRow[];
  if (rows.length === 0) return [];

  const endorserIds = [...new Set(rows.map((r) => r.endorser_github_id))];
  const endorsers = await getDirectoryEntriesByIds(endorserIds).catch(() => []);
  const byId = new Map(endorsers.map((e) => [e.githubId, e]));

  return rows.map((row) => {
    const endorser = byId.get(row.endorser_github_id);
    return {
      id: row.id,
      endorserGithubId: row.endorser_github_id,
      endorserName: endorser?.displayName ?? "A verified developer",
      endorserAvatarUrl: endorser?.avatarUrl ?? null,
      skillCategory: row.skill_category,
      comment: row.comment,
      createdAt: row.created_at,
    };
  });
}

export async function createEndorsement(
  endorserGithubId: string,
  endorseeGithubId: string,
  skillCategory: SkillCategory,
  comment: string | null
): Promise<void> {
  if (endorserGithubId === endorseeGithubId) {
    throw new Error("You can't endorse yourself.");
  }

  const { error } = await getSupabaseAdmin()
    .from("endorsements")
    .upsert(
      {
        endorser_github_id: endorserGithubId,
        endorsee_github_id: endorseeGithubId,
        skill_category: skillCategory,
        comment,
      },
      { onConflict: "endorser_github_id,endorsee_github_id,skill_category" }
    );

  if (error) throw new Error(error.message);
}
