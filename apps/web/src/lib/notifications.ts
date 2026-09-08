import type { NotificationItem, NotificationType } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface NotificationRow {
  id: string;
  github_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function rowToNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/**
 * Best-effort side effect for the routes that trigger real notifications
 * (adding experience/certifications, finishing a skill test) — a Supabase
 * hiccup here shouldn't fail the save/submit it's attached to, so callers
 * fire-and-forget this rather than awaiting it into their own error path.
 */
export async function createNotification(
  githubId: string,
  notification: { type: NotificationType; title: string; body?: string | null; link?: string | null }
): Promise<void> {
  try {
    await getSupabaseAdmin().from("notifications").insert({
      github_id: githubId,
      type: notification.type,
      title: notification.title,
      body: notification.body ?? null,
      link: notification.link ?? null,
    });
  } catch {
    // notifications are a nice-to-have side effect, not worth failing the caller over
  }
}
