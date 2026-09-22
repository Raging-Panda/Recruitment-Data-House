import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { bookInterviewSlot, getInterviewRequest } from "@/lib/interviews";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const slot = typeof body?.slot === "string" ? body.slot : "";
  if (!slot) return NextResponse.json({ error: "slot is required" }, { status: 400 });

  const existing = await getInterviewRequest(params.id).catch(() => null);
  if (!existing || existing.candidateId !== session.githubId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!existing.proposedSlots.includes(slot)) {
    return NextResponse.json({ error: "That slot wasn't one of the proposed times" }, { status: 400 });
  }

  const booked = await bookInterviewSlot(params.id, session.githubId, slot).catch(() => null);
  if (!booked) {
    return NextResponse.json({ error: "This request is no longer open" }, { status: 409 });
  }

  void createNotification(booked.recruiterId, {
    type: "interview_booked",
    title: "Interview booked",
    body: `Your interview request "${booked.title}" was booked.`,
    link: "/dashboard/interviews",
  });

  return NextResponse.json({ interview: booked });
}
