import type { Session } from "next-auth";

/**
 * True for every sign-in method that carries a real GitHub OAuth token
 * (GitHub itself, the demo account, the test account — all three stand in
 * for "GitHub-shaped data exists"). False for Google, the one provider
 * that authenticates a person without ever producing a GitHub token — see
 * the comment on the Google branch of the jwt callback in lib/auth.ts.
 *
 * Every page that calls loadDeveloperHubData / loadContributionCalendar /
 * loadProjectActivityTimeline must check this first: those functions call
 * the GitHub API directly with session.accessToken, which is undefined for
 * a Google-only account.
 */
export function hasGithubConnection(session: Session | null | undefined): boolean {
  return Boolean(session?.accessToken);
}
