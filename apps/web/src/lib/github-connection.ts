import type { Session } from "next-auth";
import { getLinkedAccessToken } from "./linked-accounts";

/**
 * Resolves a usable GitHub API token for the signed-in session — from the
 * session itself (GitHub/demo/test sign-in) if present, otherwise from a
 * linked GitHub account (see app/api/link/*), otherwise null. Every page
 * that calls loadDeveloperHubData / loadContributionCalendar /
 * loadProjectActivityTimeline should get its token from here rather than
 * reading session.accessToken directly, so a linked account works
 * anywhere a primary GitHub sign-in did.
 */
export async function getGithubAccessToken(
  session: Session | null | undefined
): Promise<string | null> {
  if (session?.accessToken) return session.accessToken;
  if (!session?.githubId) return null;
  return getLinkedAccessToken(session.githubId, "github");
}

export async function hasGithubConnection(session: Session | null | undefined): Promise<boolean> {
  return Boolean(await getGithubAccessToken(session));
}
