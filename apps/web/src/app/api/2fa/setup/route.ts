import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LOCAL_ID_PREFIX } from "@/lib/local-account";
import { generateTotpSecret, buildOtpauthUri, formatSecretForDisplay } from "@/lib/two-factor";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!session.githubId.startsWith(LOCAL_ID_PREFIX)) {
    return NextResponse.json(
      { error: "Two-factor authentication only applies to email/password accounts." },
      { status: 400 }
    );
  }

  const secret = generateTotpSecret();
  return NextResponse.json({
    secret,
    displaySecret: formatSecretForDisplay(secret),
    otpauthUri: buildOtpauthUri(secret, session.user?.email ?? "you"),
  });
}
