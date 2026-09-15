import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

export type LinkProvider = "github" | "google" | "linkedin";

interface LinkedAccountRow {
  provider: LinkProvider;
  provider_account_id: string;
  provider_login: string | null;
  access_token: string | null;
  avatar_url: string | null;
  linked_at: string;
}

/** Public-facing shape — never carries the access token out of this module. */
export interface LinkedAccount {
  provider: LinkProvider;
  providerLogin: string | null;
  avatarUrl: string | null;
  linkedAt: string;
}

function toPublic(row: LinkedAccountRow): LinkedAccount {
  return {
    provider: row.provider,
    providerLogin: row.provider_login,
    avatarUrl: row.avatar_url,
    linkedAt: row.linked_at,
  };
}

/** Every provider linked to this identity — the Settings page's
 * "Connected Accounts" list. */
export async function getLinkedAccounts(ownerId: string): Promise<LinkedAccount[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("linked_accounts")
    .select("provider, provider_account_id, provider_login, access_token, avatar_url, linked_at")
    .eq("owner_id", ownerId);

  if (error) throw new Error(error.message);
  return (data as LinkedAccountRow[]).map(toPublic);
}

export async function getLinkedAccountsSafe(ownerId: string): Promise<LinkedAccount[]> {
  try {
    return await getLinkedAccounts(ownerId);
  } catch {
    return [];
  }
}

/**
 * Internal-only lookup that includes the access token — the one thing
 * every other export of this module deliberately hides. Used solely to
 * resolve a GitHub API token for an identity that isn't itself a GitHub
 * sign-in (see lib/github-connection.ts).
 */
export async function getLinkedAccessToken(
  ownerId: string,
  provider: LinkProvider
): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("linked_accounts")
    .select("access_token")
    .eq("owner_id", ownerId)
    .eq("provider", provider)
    .maybeSingle();

  if (error || !data) return null;
  return data.access_token;
}

export interface UpsertLinkedAccountInput {
  ownerId: string;
  provider: LinkProvider;
  providerAccountId: string;
  providerLogin: string | null;
  accessToken: string | null;
  avatarUrl: string | null;
}

/** A given provider account (e.g. one specific GitHub user) can only ever
 * be linked to one IPSkill identity — the unique (provider,
 * provider_account_id) constraint enforces that server-side; this throws
 * a recognisable error when it's already claimed by someone else. */
export async function upsertLinkedAccount(input: UpsertLinkedAccountInput): Promise<void> {
  const { error } = await getSupabaseAdmin().from("linked_accounts").upsert(
    {
      owner_id: input.ownerId,
      provider: input.provider,
      provider_account_id: input.providerAccountId,
      provider_login: input.providerLogin,
      access_token: input.accessToken,
      avatar_url: input.avatarUrl,
      linked_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,provider" }
  );

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new Error("ALREADY_LINKED_ELSEWHERE");
    }
    throw new Error(error.message);
  }
}

export async function deleteLinkedAccount(ownerId: string, provider: LinkProvider): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("linked_accounts")
    .delete()
    .eq("owner_id", ownerId)
    .eq("provider", provider);

  if (error) throw new Error(error.message);
}
