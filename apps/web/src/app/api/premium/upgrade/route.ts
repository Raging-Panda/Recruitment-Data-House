import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { setPlan } from "@/lib/premium";

/**
 * Self-serve stub — no payment processor is connected yet, so this just
 * sets the plan directly to premium_recruiter (the tier that unlocks
 * Recruiter Tools). Exists so the paywall has something real to do rather
 * than being a dead end; swap this out once real billing (Stripe) is wired
 * up. See /api/premium/set-plan for the test-account-only QA toggle that
 * can also reach premium_dev or go back down to free.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  try {
    await setPlan(session.githubId, "premium_recruiter");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upgrade" },
      { status: 500 }
    );
  }
}
