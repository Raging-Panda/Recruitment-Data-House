import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { createApiKey, listApiKeys } from "@/lib/api-keys";
import { getPlan } from "@/lib/premium";
import { hasRecruiterAccess } from "@/lib/plan";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return NextResponse.json({ keys: [] });

  const keys = await listApiKeys(session.user.email).catch(() => []);
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId || !session.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();
  // The API is for enterprise clients pulling candidates into their own ATS
  // — a recruiter-side feature. Listing/revoking stays open to everyone so
  // nobody is ever stuck with a key they can't see or revoke.
  if (!hasRecruiterAccess(await getPlan(session.githubId))) {
    return NextResponse.json({ error: "API keys are part of Premium Recruiter." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const label = typeof body?.label === "string" && body.label.trim() ? body.label.trim() : "Unnamed key";

  try {
    const key = await createApiKey(session.user.email, label);
    return NextResponse.json({ key }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
