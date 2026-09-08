import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isTestAccount } from "@/lib/test-mode";
import { setPlan, type Plan } from "@/lib/premium";

const VALID_PLANS: Plan[] = ["free", "premium_dev", "premium_recruiter"];

/**
 * QA-only — lets the dev-only ALLOW_TEST_LOGIN test account cycle through
 * all three plans (including back down to free) to exercise every gated
 * feature without real billing. Rejected for every other account,
 * including the demo account, so this can never become a real-user
 * "set your own plan for free" backdoor.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isTestAccount(session.githubId)) {
    return NextResponse.json(
      { error: "Only the test account can set its plan directly." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const plan = body?.plan;
  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    await setPlan(session.githubId, plan);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to set plan" },
      { status: 500 }
    );
  }
}
