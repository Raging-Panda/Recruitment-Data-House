import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoAccount } from "@/lib/demo-mode";
import { createLinkState, LINK_STATE_COOKIE } from "@/lib/link-state";
import { LINK_PROVIDERS, getLinkProviderCredentials } from "@/lib/link-providers";
import type { LinkProvider } from "@/lib/linked-accounts";

const VALID_PROVIDERS: LinkProvider[] = ["github", "google", "linkedin"];

/**
 * Begins the account-linking OAuth round trip for one provider. Not a
 * NextAuth route — see lib/link-providers.ts for why this whole flow is
 * hand-rolled instead of reusing signIn("github"). Requires an existing
 * IPSkill session; the point is to attach a provider account to it, not
 * to authenticate a new one.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isDemoAccount(session.githubId)) {
    return NextResponse.redirect(new URL("/dashboard/settings?linkError=demo", req.url));
  }

  const provider = params.provider as LinkProvider;
  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const { clientId } = getLinkProviderCredentials(provider);
  if (!clientId) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?linkError=not_configured&provider=${provider}`, req.url)
    );
  }

  const { state, nonce } = createLinkState(session.githubId, provider);
  const redirectUri = `${req.nextUrl.origin}/api/link/callback/${provider}`;
  const authorizeUrl = LINK_PROVIDERS[provider].authorizeUrl({ clientId, redirectUri, state });

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(LINK_STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/api/link",
  });
  return res;
}
