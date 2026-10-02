/**
 * The canonical public origin, for sitemap/robots/canonical/JSON-LD URLs.
 * SITE_URL wins so a real domain can be set without touching NEXTAUTH_URL
 * (which on preview deployments is pinned to a Vercel alias for OAuth).
 */
export function getSiteUrl(): string {
  const raw = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
