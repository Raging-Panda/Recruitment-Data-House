import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses Row Level Security. This must never be
 * imported from client components; the `server-only` import above makes
 * that a build-time error rather than a runtime leak. work_experience has
 * RLS enabled with no policies, so this key is the only way in, and every
 * caller must scope queries by the authenticated session's github ID
 * itself rather than trusting client-supplied identifiers.
 *
 * Built lazily (not at module scope) so `next build` can statically collect
 * route data without SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY set — it only
 * throws once a request actually tries to use it unconfigured.
 */
let client: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
    // Next keeps fetch() responses in its Data Cache, which on Vercel
    // outlives deploys. Database reads must always be live, or a profile
    // that was deleted, made private or taken down keeps showing publicly.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return client;
}
