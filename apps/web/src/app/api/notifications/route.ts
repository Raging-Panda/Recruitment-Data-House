import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToNotification, type NotificationRow } from "@/lib/notifications";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_NOTIFICATIONS } from "@/lib/demo-data";
import { V1_MODE } from "@/lib/v1-mode";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (isDemoAccount(session.githubId)) {
    // The skill-test-completed fixture links to /dashboard/skills, which
    // 404s in v1 mode — drop it there rather than ship a dead link on the
    // one account this app's demo/preview traffic actually clicks through.
    const notifications = V1_MODE
      ? DEMO_NOTIFICATIONS.filter((n) => n.type !== "skill_test_completed")
      : DEMO_NOTIFICATIONS;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return NextResponse.json({ notifications, unreadCount });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("notifications")
    .select("*")
    .eq("github_id", session.githubId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notifications = (data as NotificationRow[]).map(rowToNotification);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return NextResponse.json({ notifications, unreadCount });
}
