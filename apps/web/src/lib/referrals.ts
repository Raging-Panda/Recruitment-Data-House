import "server-only";
import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function getOrCreateReferralCode(ownerId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (existing?.code) return existing.code;

  const code = randomBytes(4).toString("hex");
  const { error } = await supabase.from("referral_codes").insert({ owner_id: ownerId, code });
  if (error) throw new Error(error.message);
  return code;
}

export async function getReferralStats(ownerId: string): Promise<{ code: string | null; count: number }> {
  const supabase = getSupabaseAdmin();
  const { data: codeRow } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!codeRow?.code) return { code: null, count: 0 };

  const { count } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("code", codeRow.code);
  return { code: codeRow.code, count: count ?? 0 };
}

/** Best-effort attribution — called from registration/first-login. A
 * referred_owner_id can only ever redeem one code (unique constraint), so
 * a double-call (e.g. cookie read twice) is harmless. */
export async function attributeReferral(code: string, referredOwnerId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: codeRow } = await supabase.from("referral_codes").select("owner_id").eq("code", code).maybeSingle();
    if (!codeRow || codeRow.owner_id === referredOwnerId) return;
    await supabase.from("referrals").insert({ code, referred_owner_id: referredOwnerId });
  } catch {
    // best-effort — a broken referral shouldn't break signup
  }
}
