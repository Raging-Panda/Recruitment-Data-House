import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;
// Can't collide with real routes or read as an official/impersonating handle.
const RESERVED = new Set([
  "admin", "api", "app", "dashboard", "login", "logout", "settings", "help",
  "support", "about", "terms", "privacy", "ipskill", "www", "static",
  "public", "assets", "p", "u", "team", "directory", "blog",
]);

export function validateHandle(raw: string): { ok: true; handle: string } | { ok: false; error: string } {
  const handle = raw.trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) {
    return {
      ok: false,
      error: "3-30 characters, lowercase letters/numbers/hyphens, can't start or end with a hyphen",
    };
  }
  if (RESERVED.has(handle)) return { ok: false, error: "That handle is reserved" };
  return { ok: true, handle };
}

/**
 * The public collision surface is `directory_profiles` (that's what
 * `/u/[handle]` actually reads), not `candidate_profile` (where this
 * candidate's own handle *preference* is written) — they're separate
 * tables, synced independently, and seed/showcase directory rows were
 * inserted straight into `directory_profiles` with no `candidate_profile`
 * row backing them at all. Checking only `candidate_profile`, as this
 * used to, let a real account successfully "claim" a handle a showcase
 * profile already owned in `directory_profiles` — invisible until that
 * account's next profile sync, at which point two rows shared the same
 * handle and `/u/<handle>` started resolving unpredictably (sometimes
 * the wrong owner, sometimes a spurious "not found" once a duplicate
 * existed). Checks both tables now; `directory_profiles.handle` also has
 * a DB-level unique index (migration 0009) as the actual backstop —
 * this check is the friendly pre-flight, not the only thing preventing a
 * collision.
 */
export async function isHandleTaken(handle: string, excludeOwnerId?: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const [candidateResult, directoryResult] = await Promise.all([
    supabase.from("candidate_profile").select("github_id").eq("handle", handle).limit(1),
    supabase.from("directory_profiles").select("github_id").eq("handle", handle).limit(1),
  ]);
  const owners = [
    (candidateResult.data as { github_id: string }[] | null)?.[0]?.github_id,
    (directoryResult.data as { github_id: string }[] | null)?.[0]?.github_id,
  ].filter((id): id is string => Boolean(id));
  return owners.some((owner) => owner !== excludeOwnerId);
}
