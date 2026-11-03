import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { isDemoAccount } from "@/lib/demo-mode";
import { setPlan, type Plan } from "@/lib/premium";

const VALID_PLANS: Plan[] = ["free", "premium_dev", "premium_recruiter"];
// A GitHub numeric id, or a provider-prefixed id (google:/linkedin:/local:) —
// the format every account ID takes, as shown in Settings.
const ACCOUNT_ID_RE = /^(\d{1,20}|(google|linkedin|local):[\w.-]{1,128})$/;

/**
 * How paid plans are granted until billing exists: an admin sets a plan for
 * an account ID the person sent them (see RequestAccess). Setting "free"
 * revokes it.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!isAdmin(session.githubId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const accountId = typeof body?.accountId === "string" ? body.accountId.trim() : "";
  const plan = body?.plan;
  if (!ACCOUNT_ID_RE.test(accountId)) {
    return NextResponse.json({ error: "That doesn't look like an account ID" }, { status: 400 });
  }
  if (isDemoAccount(accountId)) {
    return NextResponse.json({ error: "The demo account's plan is fixed" }, { status: 400 });
  }
  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    await setPlan(accountId, plan);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to set plan" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, accountId, plan });
}
