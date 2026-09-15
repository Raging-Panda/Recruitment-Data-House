import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoAccount } from "@/lib/demo-mode";
import { getOrCreateReferralCode, getReferralStats } from "@/lib/referrals";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) {
    return NextResponse.json({ code: "demo1234", count: 3 });
  }

  try {
    await getOrCreateReferralCode(session.githubId);
    const stats = await getReferralStats(session.githubId);
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
