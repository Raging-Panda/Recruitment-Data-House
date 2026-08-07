import { randomUUID } from "crypto";
import type { DirectoryEntry } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDirectoryEntry } from "@/lib/directory";

const LINK_TTL_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface PublicProfileLinkStatus {
  token: string | null;
  path: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  isRevoked: boolean;
  viewCount: number;
}

interface LinkRow {
  token: string;
  created_at: string;
  expires_at: string | null;
  revoked: boolean;
  view_count: number;
}

function toStatus(row: LinkRow | null): PublicProfileLinkStatus {
  if (!row) {
    return {
      token: null,
      path: null,
      createdAt: null,
      expiresAt: null,
      isExpired: false,
      isRevoked: false,
      viewCount: 0,
    };
  }
  return {
    token: row.token,
    path: `/p/${row.token}`,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isExpired: row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false,
    isRevoked: row.revoked,
    viewCount: row.view_count,
  };
}

export async function getPublicProfileLinkStatus(githubId: string): Promise<PublicProfileLinkStatus> {
  const { data, error } = await getSupabaseAdmin()
    .from("public_profile_links")
    .select("token, created_at, expires_at, revoked, view_count")
    .eq("github_id", githubId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return toStatus(data as LinkRow | null);
}

/** Creates a fresh link, or regenerates (new token, reset expiry/view count)
 * if one already exists — old copies of a shared link stop working the
 * moment this runs, which is the whole point of "revocable". */
export async function generatePublicProfileLink(githubId: string): Promise<PublicProfileLinkStatus> {
  const now = new Date();
  const { data, error } = await getSupabaseAdmin()
    .from("public_profile_links")
    .upsert(
      {
        github_id: githubId,
        token: randomUUID(),
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + LINK_TTL_DAYS * DAY_MS).toISOString(),
        revoked: false,
        view_count: 0,
      },
      { onConflict: "github_id" }
    )
    .select("token, created_at, expires_at, revoked, view_count")
    .single();

  if (error) throw new Error(error.message);
  return toStatus(data as LinkRow);
}

export async function revokePublicProfileLink(githubId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("public_profile_links")
    .update({ revoked: true })
    .eq("github_id", githubId);

  if (error) throw new Error(error.message);
}

/**
 * Public, unauthenticated lookup for the /p/[token] page. Returns null for
 * any invalid state (not found, revoked, expired) without distinguishing
 * why — a dead link should look the same to a visitor either way. Best-
 * effort view-count increment (read-then-write, not atomic) — acceptable
 * for a low-traffic share-link counter, same tradeoff as elsewhere in the
 * app's view tracking.
 */
export async function getDirectoryEntryByPublicToken(
  token: string
): Promise<{ entry: DirectoryEntry; viewCount: number } | null> {
  const supabase = getSupabaseAdmin();
  const { data: link, error } = await supabase
    .from("public_profile_links")
    .select("github_id, revoked, expires_at, view_count")
    .eq("token", token)
    .maybeSingle();

  if (error || !link || link.revoked) return null;
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) return null;

  const entry = await getDirectoryEntry(link.github_id);
  if (!entry) return null;

  const viewCount = link.view_count + 1;
  try {
    await supabase.from("public_profile_links").update({ view_count: viewCount }).eq("token", token);
  } catch {
    // the visible profile shouldn't fail to load over a view-count write hiccup
  }

  return { entry, viewCount };
}
