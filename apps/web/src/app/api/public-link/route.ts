import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { generatePublicProfileLink, revokePublicProfileLink } from "@/lib/public-profile-link";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  try {
    const status = await generatePublicProfileLink(session.githubId);
    return NextResponse.json({ status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate link" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  try {
    await revokePublicProfileLink(session.githubId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to revoke link" },
      { status: 500 }
    );
  }
}
