import { NextRequest, NextResponse } from "next/server";

/**
 * The mobile app can't hold the GitHub OAuth client secret, so it sends the
 * authorization code here and this route does the code-for-token exchange
 * server-side, mirroring what NextAuth does for the web login flow.
 */
export async function POST(req: NextRequest) {
  const { code, redirectUri } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  // Mobile needs its own GitHub OAuth App (separate from the web one) because
  // GitHub OAuth Apps only accept a single, fixed callback URL, and the
  // mobile app's redirect uses the "ipskill://" custom scheme instead of
  // the web app's http://localhost:3000/... callback.
  const clientId = process.env.GITHUB_MOBILE_CLIENT_ID;
  const clientSecret = process.env.GITHUB_MOBILE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Mobile GitHub OAuth is not configured" }, { status: 500 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await tokenRes.json();
  if (data.error || !data.access_token) {
    return NextResponse.json(
      { error: data.error_description ?? "Token exchange failed" },
      { status: 400 }
    );
  }

  return NextResponse.json({ accessToken: data.access_token });
}
