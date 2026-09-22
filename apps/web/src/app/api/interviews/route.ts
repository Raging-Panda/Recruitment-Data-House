import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { getPlan, hasRecruiterAccess } from "@/lib/premium";
import { createInterviewRequest, listInterviewsFor, MAX_PROPOSED_SLOTS } from "@/lib/interviews";
import { createNotification } from "@/lib/notifications";

const MIN_DURATION = 15;
const MAX_DURATION = 180;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return NextResponse.json({ interviews: [] });

  const interviews = await listInterviewsFor(session.githubId).catch(() => []);
  return NextResponse.json({ interviews });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const plan = await getPlan(session.githubId);
  if (!hasRecruiterAccess(plan)) {
    return NextResponse.json({ error: "Recruiter Tools is required to propose interviews" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const candidateGithubId = typeof body?.candidateGithubId === "string" ? body.candidateGithubId : "";
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : "Interview";
  const durationMinutes = Number(body?.durationMinutes);
  const proposedSlots = Array.isArray(body?.proposedSlots)
    ? body.proposedSlots.filter((s: unknown): s is string => typeof s === "string")
    : [];

  if (!candidateGithubId) {
    return NextResponse.json({ error: "candidateGithubId is required" }, { status: 400 });
  }
  if (candidateGithubId === session.githubId) {
    return NextResponse.json({ error: "You can't schedule an interview with yourself" }, { status: 400 });
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes < MIN_DURATION || durationMinutes > MAX_DURATION) {
    return NextResponse.json(
      { error: `durationMinutes must be between ${MIN_DURATION} and ${MAX_DURATION}` },
      { status: 400 }
    );
  }
  if (proposedSlots.length === 0 || proposedSlots.length > MAX_PROPOSED_SLOTS) {
    return NextResponse.json(
      { error: `Propose between 1 and ${MAX_PROPOSED_SLOTS} time slots` },
      { status: 400 }
    );
  }
  const now = Date.now();
  const parsedSlots: Date[] = proposedSlots.map((s: string) => new Date(s));
  if (parsedSlots.some((d: Date) => Number.isNaN(d.getTime()) || d.getTime() <= now)) {
    return NextResponse.json({ error: "Every proposed slot must be a valid, future date/time" }, { status: 400 });
  }

  try {
    const interview = await createInterviewRequest(
      session.githubId,
      candidateGithubId,
      title,
      Math.round(durationMinutes),
      parsedSlots.map((d: Date) => d.toISOString())
    );
    void createNotification(candidateGithubId, {
      type: "interview_proposed",
      title: "Interview requested",
      body: `A recruiter proposed ${parsedSlots.length === 1 ? "a time" : `${parsedSlots.length} times`} for "${title}".`,
      link: "/dashboard/interviews",
    });
    return NextResponse.json({ interview }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
