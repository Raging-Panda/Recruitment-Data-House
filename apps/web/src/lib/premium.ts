import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";
import type { Plan } from "@/lib/plan";

export type { Plan } from "@/lib/plan";
export { PLAN_LABELS, hasRecruiterAccess } from "@/lib/plan";

/**
 * There's no payment processor wired up yet, so this is a plain `plan`
 * column on candidate_profile. Real accounts self-serve to
 * "premium_recruiter" via /api/premium/upgrade; the dev-only test account
 * can additionally cycle through all three tiers via /api/premium/set-plan
 * for QA, since ALLOW_TEST_LOGIN needs to exercise every gate without real
 * GitHub OAuth or billing.
 *
 * The demo account is always premium_recruiter so the public showcase
 * always shows the full product. A Supabase hiccup fails closed (free)
 * rather than 500ing or accidentally unlocking a paid section.
 */
export async function getPlan(githubId: string | null | undefined): Promise<Plan> {
  if (!githubId) return "free";
  if (isDemoAccount(githubId)) return "premium_recruiter";

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("candidate_profile")
      .select("plan")
      .eq("github_id", githubId)
      .maybeSingle();
    if (error || !data?.plan) return "free";
    return data.plan as Plan;
  } catch {
    return "free";
  }
}

export async function setPlan(githubId: string, plan: Plan): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("candidate_profile")
    .upsert(
      { github_id: githubId, plan, updated_at: new Date().toISOString() },
      { onConflict: "github_id" }
    );
  if (error) throw new Error(error.message);
}
