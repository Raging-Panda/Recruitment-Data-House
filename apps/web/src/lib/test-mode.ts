/**
 * Dev-only bypass so the app can be clicked through and tested without a
 * real GitHub OAuth round trip. Gated behind an explicit env var (never
 * NODE_ENV, since Vercel builds preview deployments with
 * NODE_ENV=production too) so it can never end up reachable unless
 * someone deliberately sets ALLOW_TEST_LOGIN=true on that environment.
 */
export function isTestModeEnabled(): boolean {
  return process.env.ALLOW_TEST_LOGIN === "true";
}

export const TEST_ACCESS_TOKEN = "test-mode";
export const TEST_GITHUB_ID = "900000001";

/** Same dev bypass, but for exercising the no-GitHub-connection path (see
 * lib/github-connection.ts) without a real Google OAuth app — the "google:"
 * prefix and the total absence of an access token mirror exactly what a
 * real Google sign-in produces. */
export const TEST_GOOGLE_ID = "google:test-900000003";

export function isTestAccount(githubId: string | null | undefined): boolean {
  return githubId === TEST_GITHUB_ID;
}
