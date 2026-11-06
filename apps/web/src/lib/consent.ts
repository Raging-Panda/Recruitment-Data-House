import "server-only";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CONSENT_VERSION } from "@/lib/legal";
import { CONSENT_COOKIE } from "@/lib/consent-cookie";

/**
 * POPIA consent records (privacy_consents). POPIA puts the burden of
 * proving consent on us, so every account's consent is stored with the
 * policy version it covered and when it was given. Two ways in: the login
 * page's tick box (carried by CONSENT_COOKIE, recorded on sign-in) and the
 * /consent page, which the dashboard sends anyone without a record to.
 */

/** When this account consented to the current CONSENT_VERSION, or null if it hasn't. */
export async function getConsentedAt(accountId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("privacy_consents")
    .select("consented_at")
    .eq("owner_id", accountId)
    .eq("version", CONSENT_VERSION)
    .maybeSingle();
  if (error) throw new Error(`privacy_consents: ${error.message}`);
  return (data?.consented_at as string | undefined) ?? null;
}

/** The dashboard gate. Fails open: if the check itself errors (the table
 * not migrated yet, a database blip), sending everyone to /consent would
 * lock every member out behind a page that can't save either. */
export async function needsConsent(accountId: string): Promise<boolean> {
  try {
    return (await getConsentedAt(accountId)) === null;
  } catch (err) {
    console.error("[consent] check failed", err);
    return false;
  }
}

/** Idempotent — consenting again keeps the original date. */
export async function recordConsent(accountId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("privacy_consents")
    .upsert(
      { owner_id: accountId, version: CONSENT_VERSION },
      { onConflict: "owner_id,version", ignoreDuplicates: true }
    );
  if (error) throw new Error(`privacy_consents: ${error.message}`);
}

/** Called from the sign-in callback: records the consent if the visitor
 * ticked the login page's box for the current version. Never throws — if
 * this misses, the dashboard's /consent gate asks instead. */
export async function recordConsentFromCookie(accountId: string): Promise<void> {
  try {
    if (cookies().get(CONSENT_COOKIE)?.value !== CONSENT_VERSION) return;
    await recordConsent(accountId);
  } catch (err) {
    console.error("[consent] couldn't record the login page's consent", err);
  }
}
