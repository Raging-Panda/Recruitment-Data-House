import { getSupabaseAdmin } from "@/lib/supabase";
import { DEMO_GITHUB_ID } from "@/lib/demo-mode";
import { VERIFIED_SKILL_THRESHOLD } from "@/lib/skill-tests";

export interface VerificationBadge {
  id: "github" | "skills" | "reviewed";
  label: string;
  description: string;
}

export interface ProfileModeration {
  adminVerified: boolean;
  hidden: boolean;
}

const NONE: ProfileModeration = { adminVerified: false, hidden: false };

/** Moderation row for a profile. Falls back to "nothing set" on any
 * error — including the table not existing yet pre-migration — so a
 * Supabase hiccup never takes a public profile down. */
export async function getModerationSafe(githubId: string): Promise<ProfileModeration> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("profile_verifications")
      .select("admin_verified, hidden")
      .eq("github_id", githubId)
      .maybeSingle();
    if (error || !data) return NONE;
    return { adminVerified: Boolean(data.admin_verified), hidden: Boolean(data.hidden) };
  } catch {
    return NONE;
  }
}

async function countPassedSkills(githubId: string): Promise<number> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("skill_test_attempts")
      .select("template_id")
      .eq("github_id", githubId)
      .gte("percentage", VERIFIED_SKILL_THRESHOLD);
    return new Set((data ?? []).map((r: { template_id: string }) => r.template_id)).size;
  } catch {
    return 0;
  }
}

/** Only checks that are real and cheap — each badge states what was
 * actually verified, never a vague "verified". Employer/ID checks are
 * deliberately absent until there's a real source for them. */
export async function getVerificationBadges(
  githubId: string,
  moderation?: ProfileModeration
): Promise<VerificationBadge[]> {
  const mod = moderation ?? (await getModerationSafe(githubId));
  const badges: VerificationBadge[] = [];

  // Numeric id = signed in through GitHub itself (google:/linkedin:/local:
  // identities carry a prefix); the demo persona is a fixture, not a person.
  if (/^\d+$/.test(githubId) && githubId !== DEMO_GITHUB_ID) {
    badges.push({
      id: "github",
      label: "GitHub-verified",
      description: "Signed in through GitHub; the skill fingerprint is computed from this account's real activity.",
    });
  }

  const passed = await countPassedSkills(githubId);
  if (passed > 0) {
    badges.push({
      id: "skills",
      label: `${passed} verified skill${passed === 1 ? "" : "s"}`,
      description: `Passed ${passed} IPSkill knowledge check${passed === 1 ? "" : "s"} with ${VERIFIED_SKILL_THRESHOLD}% or higher.`,
    });
  }

  if (mod.adminVerified) {
    badges.push({
      id: "reviewed",
      label: "Reviewed by IPSkill",
      description: "An IPSkill team member has manually reviewed this profile.",
    });
  }
  return badges;
}

/** Ids an admin has taken down. Safe-fallback to "none hidden" so a
 * missing table (pre-migration) or Supabase error can't blank the index. */
export async function getHiddenIdsSafe(): Promise<Set<string>> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("profile_verifications")
      .select("github_id")
      .eq("hidden", true);
    if (error) return new Set();
    return new Set((data ?? []).map((r: { github_id: string }) => r.github_id));
  } catch {
    return new Set();
  }
}
