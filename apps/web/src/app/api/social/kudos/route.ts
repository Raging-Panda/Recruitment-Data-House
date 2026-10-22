import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { giveKudos, removeKudos } from "@/lib/social";
import { createNotification } from "@/lib/notifications";
import { hitRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const MILESTONE_LABELS: Record<string, string> = {
  skill_test_completed: "passing a skill test",
  certification_added: "your new certification",
  featured_project_added: "featuring a project",
  endorsement_received: "your endorsement",
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const eventId = typeof body?.eventId === "string" ? body.eventId : "";
  const remove = body?.remove === true;
  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

  try {
    if (remove) {
      await removeKudos(session.githubId, eventId);
    } else {
      const event = await giveKudos(session.githubId, eventId);
      if (event && event.ownerId !== session.githubId) {
        const notified = await hitRateLimit(
          `kudos-notify:${session.githubId}:${eventId}`,
          RATE_LIMITS.kudosNotifyPerEvent
        );
        if (!notified.limited) {
          await createNotification(event.ownerId, {
            type: "kudos_received",
            title: `${session.user?.name || "Someone"} gave you kudos`,
            body: `For ${MILESTONE_LABELS[event.type] ?? "a recent milestone"}.`,
            link: "/dashboard/profile",
          });
        }
      }
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
