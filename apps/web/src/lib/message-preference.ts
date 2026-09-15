import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";

export type MessagePreference = "open" | "request";

/** Missing row / missing column (pre-migration) both fall back to "open" —
 * the pre-existing behavior, so nothing gets more locked-down than it
 * already was until someone deliberately opts into requiring requests. */
export async function getMessagePreference(githubId: string): Promise<MessagePreference> {
  if (isDemoAccount(githubId)) return "open";
  try {
    const { data } = await getSupabaseAdmin()
      .from("candidate_profile")
      .select("message_preference")
      .eq("github_id", githubId)
      .maybeSingle();
    return (data?.message_preference as MessagePreference) ?? "open";
  } catch {
    return "open";
  }
}

export async function setMessagePreference(githubId: string, preference: MessagePreference): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("candidate_profile")
    .upsert(
      { github_id: githubId, message_preference: preference, updated_at: new Date().toISOString() },
      { onConflict: "github_id" }
    );
  if (error) throw new Error(error.message);
}
