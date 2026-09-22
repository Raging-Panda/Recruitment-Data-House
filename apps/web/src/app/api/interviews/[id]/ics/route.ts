import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInterviewRequest } from "@/lib/interviews";
import { buildIcsContent } from "@/lib/calendar-links";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const interview = await getInterviewRequest(params.id).catch(() => null);
  if (
    !interview ||
    (interview.recruiterId !== session.githubId && interview.candidateId !== session.githubId)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (interview.status !== "booked" || !interview.selectedSlot) {
    return NextResponse.json({ error: "This interview hasn't been booked yet" }, { status: 400 });
  }

  const ics = buildIcsContent({
    title: interview.title,
    startIso: interview.selectedSlot,
    durationMinutes: interview.durationMinutes,
    details: "Scheduled via IPSkill.",
    uid: `interview-${interview.id}@ipskill`,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="interview.ics"`,
    },
  });
}
