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

export async function isHandleTaken(handle: string, excludeOwnerId?: string): Promise<boolean> {
  const query = getSupabaseAdmin().from("candidate_profile").select("github_id").eq("handle", handle);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return false;
  return data.github_id !== excludeOwnerId;
}
