import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { LOCAL_ID_PREFIX } from "@/lib/local-account";

type Rows = [table: string, column: string];

/**
 * Every row tied to an account, by the column holding its account ID.
 * Phases run in order (rows pointing at people first, the profile itself
 * last), and each delete is idempotent — so if one fails part-way, the
 * account still exists and deleting again finishes the job.
 *
 * Child rows go with their parents through ON DELETE CASCADE: messages
 * with conversations, shortlist_candidates with shortlists,
 * saved_search_matches with saved_searches, kudos with activity_events.
 * Not covered on purpose: rate_limit_events (keyed by email/IP, expire
 * within a day), api_keys (issued by admins, not owned by an account).
 * A new table keyed by account ID needs adding here.
 */
const PHASES: Rows[][] = [
  [
    // Both sides of every relationship with other people. Conversations
    // go for both participants — a thread with one side missing reads
    // as nonsense.
    ["follows", "follower_id"],
    ["follows", "followee_id"],
    ["endorsements", "endorser_github_id"],
    ["endorsements", "endorsee_github_id"],
    ["profile_views", "viewer_github_id"],
    ["profile_views", "viewed_github_id"],
    ["kudos", "from_id"],
    ["interview_requests", "recruiter_id"],
    ["interview_requests", "candidate_id"],
    ["conversations", "participant_a"],
    ["conversations", "participant_b"],
    ["shortlist_candidates", "candidate_github_id"],
    ["saved_search_matches", "candidate_github_id"],
    ["referrals", "referred_owner_id"],
  ],
  [
    ["shortlists", "owner_github_id"],
    ["saved_searches", "owner_github_id"],
    ["activity_events", "owner_id"],
    ["external_links", "owner_id"],
    ["skill_proofs", "owner_id"],
    ["featured_projects", "github_id"],
    ["work_experience", "github_id"],
    ["certifications", "github_id"],
    ["skill_test_attempts", "github_id"],
    ["score_snapshots", "owner_id"],
    ["notifications", "github_id"],
    ["push_tokens", "owner_id"],
    ["public_profile_links", "github_id"],
    ["github_data_cache", "github_id"],
    ["linked_accounts", "owner_id"],
    ["profile_verifications", "github_id"],
  ],
  [
    ["directory_profiles", "github_id"],
    ["candidate_profile", "github_id"],
  ],
];

async function deleteRows(table: string, column: string, value: string | string[]): Promise<void> {
  const query = getSupabaseAdmin().from(table).delete();
  const { error } = await (Array.isArray(value) ? query.in(column, value) : query.eq(column, value));
  if (error) throw new Error(`${table}: ${error.message}`);
}

/** Permanently deletes an account and everything it owns. Callers must
 * pass the signed-in user's own ID and refuse the demo account. */
export async function deleteAccount(accountId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Other people's referrals point at this account's referral codes with
  // no cascade, so they have to go before the codes.
  const { data: codes, error } = await supabase.from("referral_codes").select("code").eq("owner_id", accountId);
  if (error) throw new Error(`referral_codes: ${error.message}`);
  if (codes?.length) await deleteRows("referrals", "code", codes.map((c) => c.code as string));
  await deleteRows("referral_codes", "owner_id", accountId);

  for (const phase of PHASES) {
    await Promise.all(phase.map(([table, column]) => deleteRows(table, column, accountId)));
  }

  // An email/password account's login lives in `users`, keyed by the uuid
  // after "local:".
  if (accountId.startsWith(LOCAL_ID_PREFIX)) {
    await deleteRows("users", "id", accountId.slice(LOCAL_ID_PREFIX.length));
  }
}
