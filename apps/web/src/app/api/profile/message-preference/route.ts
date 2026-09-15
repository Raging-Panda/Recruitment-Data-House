import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { setMessagePreference, type MessagePreference } from "@/lib/message-preference";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const preference = body?.preference as MessagePreference | undefined;
  if (preference !== "open" && preference !== "request") {
    return NextResponse.json({ error: "preference must be 'open' or 'request'" }, { status: 400 });
  }

  try {
    await setMessagePreference(session.githubId, preference);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }

  return NextResponse.json({ preference });
}
