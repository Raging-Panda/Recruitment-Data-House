import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { cancelInterviewRequest, getInterviewRequest } from "@/lib/interviews";
import { createNotification } from "@/lib/notifications";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const existing = await getInterviewRequest(params.id).catch(() => null);
  if (!existing || (existing.recruiterId !== session.githubId && existing.candidateId !== session.githubId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cancelled = await cancelInterviewRequest(params.id, session.githubId).catch(() => null);
  if (!cancelled) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const otherParty =
    cancelled.recruiterId === session.githubId ? cancelled.candidateId : cancelled.recruiterId;
  void createNotification(otherParty, {
    type: "interview_cancelled",
    title: "Interview cancelled",
    body: `"${cancelled.title}" was cancelled.`,
    link: "/dashboard/interviews",
  });

  return NextResponse.json({ interview: cancelled });
}
