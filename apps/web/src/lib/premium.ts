import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";

/**
 * Gates the Recruiter Tools section (Directory/Shortlists/Compare). There's
 * no payment processor wired up yet, so this is a plain flag on
 * candidate_profile flipped by the self-serve /api/premium/upgrade stub —
 * see improvements.md's "Free vs. Premium tiers" item for the real billing
 * integration this will eventually be replaced by.
 *
 * The demo account is always premium, so the public showcase always shows
 * the full product. The dev-only test account deliberately is NOT
 * auto-premium — it goes through the same real is_premium check as a real
 * account, so ALLOW_TEST_LOGIN can exercise the paywall and the upgrade
 * flow end-to-end without needing real GitHub OAuth. A Supabase hiccup
 * fails closed (not premium) rather than 500ing or accidentally unlocking a
 * paid section.
 */
export async function isPremiumAccount(githubId: string | null | undefined): Promise<boolean> {
  if (!githubId) return false;
  if (isDemoAccount(githubId)) return true;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("candidate_profile")
      .select("is_premium")
      .eq("github_id", githubId)
      .maybeSingle();
    if (error || !data) return false;
    return Boolean(data.is_premium);
  } catch {
    return false;
  }
}

export async function setPremium(githubId: string, isPremium: boolean): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("candidate_profile")
    .upsert(
      { github_id: githubId, is_premium: isPremium, updated_at: new Date().toISOString() },
      { onConflict: "github_id" }
    );
  if (error) throw new Error(error.message);
}
