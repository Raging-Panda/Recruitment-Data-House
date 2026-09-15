import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { setPlan } from "@/lib/premium";
import type { Plan } from "@/lib/plan";

const SELF_SERVE_TIERS: Plan[] = ["premium_dev", "premium_recruiter"];

/**
 * Self-serve stub — no payment processor is connected yet, so this just
 * sets the plan directly. Defaults to premium_recruiter (the original,
 * body-less call site — RecruiterPaywall) for backward compatibility;
 * pass {"tier": "premium_dev"} for the Growth Olympics paywall. Swap this
 * out once real billing (Stripe) is wired up. See /api/premium/set-plan
 * for the test-account-only QA toggle that can also go back down to free.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const tier: Plan = SELF_SERVE_TIERS.includes(body?.tier) ? body.tier : "premium_recruiter";

  try {
    await setPlan(session.githubId, tier);
    return NextResponse.json({ success: true, plan: tier });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upgrade" },
      { status: 500 }
    );
  }
}
