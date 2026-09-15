import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isTestModeEnabled, TEST_ACCESS_TOKEN } from "@/lib/test-mode";
import { upsertLinkedAccount, type LinkProvider } from "@/lib/linked-accounts";

const VALID_PROVIDERS: LinkProvider[] = ["github", "google", "linkedin"];

/**
 * Dev-only stand-in for a real OAuth round trip — same ALLOW_TEST_LOGIN
 * gate as the test-account/test-google-account/test-linkedin-account sign-
 * in providers in lib/auth.ts, and the same reason: exercising the
 * linking flow needs a real GitHub/Google/LinkedIn OAuth app, which this
 * sandbox doesn't have. For provider "github" specifically, the linked
 * access token is the TEST_ACCESS_TOKEN sentinel — loadDeveloperHubData
 * already special-cases that exact string to return fixture data (see
 * lib/mock-developer-data.ts), so this genuinely exercises the "GitHub
 * now connected via a linked account" path end to end, not just the DB
 * write.
 */
export async function POST(req: NextRequest) {
  if (!isTestModeEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const provider = body?.provider as LinkProvider | undefined;
  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  try {
    await upsertLinkedAccount({
      ownerId: session.githubId,
      provider,
      // Scoped to the calling session, not a fixed string — a fixed id
      // meant every test account trying to simulate-link the same
      // provider tripped the real (provider, provider_account_id)
      // uniqueness constraint against each other (found live: linking as
      // a second test account 500'd with ALREADY_LINKED_ELSEWHERE).
      providerAccountId: `test-${provider}-linked-${session.githubId}`,
      providerLogin: `test-linked-${provider}`,
      accessToken: provider === "github" ? TEST_ACCESS_TOKEN : "test-simulated-token",
      avatarUrl: "https://i.pravatar.cc/300?img=33",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "ALREADY_LINKED_ELSEWHERE" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ success: true });
}
