import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { setPremium } from "@/lib/premium";

/**
 * Self-serve stub — no payment processor is connected yet, so this just
 * flips the flag. Exists so the Recruiter Tools paywall has something real
 * to do rather than being a dead end; swap this out once real billing
 * (Stripe) is wired up.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  try {
    await setPremium(session.githubId, true);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upgrade" },
      { status: 500 }
    );
  }
}
