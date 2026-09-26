import "server-only";
import type { NextRequest } from "next/server";
import { fetchGithubUser } from "@ipskill/shared";

/**
 * The mobile app has no NextAuth session/cookie — it holds a raw GitHub
 * access token and calls these `/api/mobile/*` routes directly with it
 * (see api/mobile/github-token, api/mobile/push-token). Resolving the
 * numeric GitHub user id here, the same way NextAuth's own GitHub
 * provider does for the web login (see the jwt callback in lib/auth.ts),
 * is what proves the caller genuinely owns the identity it's acting as —
 * never trust a client-supplied githubId directly. Returns null (never
 * throws) so every route can just check for null and 401.
 */
export async function resolveMobileGithubId(req: NextRequest): Promise<string | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return null;

  try {
    const user = await fetchGithubUser(token);
    return String(user.id);
  } catch {
    return null;
  }
}
