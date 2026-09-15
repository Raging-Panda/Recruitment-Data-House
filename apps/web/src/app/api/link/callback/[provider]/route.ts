import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyLinkState, LINK_STATE_COOKIE } from "@/lib/link-state";
import { LINK_PROVIDERS, getLinkProviderCredentials } from "@/lib/link-providers";
import { upsertLinkedAccount, type LinkProvider } from "@/lib/linked-accounts";

const VALID_PROVIDERS: LinkProvider[] = ["github", "google", "linkedin"];

function toSettings(req: NextRequest, query: Record<string, string>) {
  const url = new URL("/dashboard/settings", req.url);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = NextResponse.redirect(url);
  res.cookies.delete(LINK_STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider as LinkProvider;
  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  // The user denying access at the provider's consent screen, not an
  // error on our end — a plain "cancelled" message, not a scary one.
  if (req.nextUrl.searchParams.get("error")) {
    return toSettings(req, { linkError: "cancelled", provider });
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieNonce = req.cookies.get(LINK_STATE_COOKIE)?.value;

  if (!code || !state) {
    return toSettings(req, { linkError: "invalid_request", provider });
  }

  const payload = verifyLinkState(state, cookieNonce);
  if (!payload || payload.provider !== provider) {
    return toSettings(req, { linkError: "expired", provider });
  }

  // Re-check against the *current* session, not just the one that started
  // the flow — closes the window where someone signs out and a different
  // account signs in before the OAuth round trip completes.
  const session = await getServerSession(authOptions);
  if (!session?.githubId || session.githubId !== payload.ownerId) {
    return toSettings(req, { linkError: "session_changed", provider });
  }

  try {
    const { clientId, clientSecret } = getLinkProviderCredentials(provider);
    const redirectUri = `${req.nextUrl.origin}/api/link/callback/${provider}`;
    const config = LINK_PROVIDERS[provider];

    const accessToken = await config.exchangeCode({ clientId, clientSecret, code, redirectUri });
    const profile = await config.fetchProfile(accessToken);

    await upsertLinkedAccount({
      ownerId: session.githubId,
      provider,
      providerAccountId: profile.id,
      providerLogin: profile.login,
      accessToken,
      avatarUrl: profile.avatarUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "ALREADY_LINKED_ELSEWHERE") {
      return toSettings(req, { linkError: "already_linked", provider });
    }
    return toSettings(req, { linkError: "failed", provider });
  }

  return toSettings(req, { linked: provider });
}
