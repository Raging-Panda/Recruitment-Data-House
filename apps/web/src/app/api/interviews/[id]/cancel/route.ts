import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { cancelInterviewAndNotify } from "@/lib/interviews";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const cancelled = await cancelInterviewAndNotify(params.id, session.githubId);
  if (!cancelled) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ interview: cancelled });
}
