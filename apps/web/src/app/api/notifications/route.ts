import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToNotification, type NotificationRow } from "@/lib/notifications";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_NOTIFICATIONS } from "@/lib/demo-data";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (isDemoAccount(session.githubId)) {
    const unreadCount = DEMO_NOTIFICATIONS.filter((n) => !n.isRead).length;
    return NextResponse.json({ notifications: DEMO_NOTIFICATIONS, unreadCount });
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
