import { NextRequest, NextResponse } from "next/server";
import { fetchGithubUser } from "@ipskill/shared";
import { registerPushToken, unregisterPushToken } from "@/lib/push-notifications";

const EXPO_TOKEN_RE = /^Expo(?:nent)?PushToken\[.+\]$/;

/**
 * The mobile app has no NextAuth session/cookie — it holds a raw GitHub
 * access token (see api/mobile/github-token) and calls this backend
 * directly with it. Resolving the numeric GitHub user id here, the same
 * way NextAuth's own GitHub provider does for the web login (see the jwt
 * callback in lib/auth.ts), is what proves the caller genuinely owns the
 * identity it's registering a push token against — never trust a
 * client-supplied githubId directly.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";
  const expoPushToken = typeof body?.expoPushToken === "string" ? body.expoPushToken : "";
  const platform = typeof body?.platform === "string" ? body.platform : null;

  if (!accessToken || !expoPushToken) {
    return NextResponse.json({ error: "accessToken and expoPushToken are required" }, { status: 400 });
  }
  if (!EXPO_TOKEN_RE.test(expoPushToken)) {
    return NextResponse.json({ error: "expoPushToken is not a recognizable Expo push token" }, { status: 400 });
  }

  let githubId: string;
  try {
    const user = await fetchGithubUser(accessToken);
    githubId = String(user.id);
  } catch {
    return NextResponse.json({ error: "Could not verify GitHub access token" }, { status: 401 });
  }

  try {
    await registerPushToken(githubId, expoPushToken, platform);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to register" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}

/** Called on sign-out so a shared/reused device stops getting pushes meant
 * for whoever was signed in before. Deleting by the exact token value
 * (rather than requiring re-auth) is safe — anyone who already has that
 * token running on their own device is the only one who could call this
 * for it. */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const expoPushToken = typeof body?.expoPushToken === "string" ? body.expoPushToken : "";
  if (!expoPushToken) {
    return NextResponse.json({ error: "expoPushToken is required" }, { status: 400 });
  }
  await unregisterPushToken(expoPushToken);
  return NextResponse.json({ success: true });
}
