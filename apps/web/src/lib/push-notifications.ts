import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

export async function registerPushToken(
  ownerId: string,
  expoToken: string,
  platform: string | null
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("push_tokens")
    .upsert({ owner_id: ownerId, expo_token: expoToken, platform }, { onConflict: "expo_token" });
  if (error) throw new Error(error.message);
}

export async function unregisterPushToken(expoToken: string): Promise<void> {
  await getSupabaseAdmin().from("push_tokens").delete().eq("expo_token", expoToken);
}

interface ExpoPushTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

/**
 * Fires alongside every in-app notification (see lib/notifications.ts,
 * the one place every existing trigger already goes through) — a device
 * with no registered token is the common case (web-only user, or a mobile
 * user who hasn't granted permission) and just sends to zero recipients.
 * Best-effort: never throws, mirroring every other notification side
 * effect in this app.
 */
export async function sendExpoPushNotification(
  ownerId: string,
  message: { title: string; body?: string | null; link?: string | null }
): Promise<void> {
  try {
    const { data: tokens } = await getSupabaseAdmin()
      .from("push_tokens")
      .select("expo_token")
      .eq("owner_id", ownerId);
    if (!tokens || tokens.length === 0) return;

    const res = await fetch(EXPO_PUSH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        tokens.map((t) => ({
          to: t.expo_token,
          title: message.title,
          body: message.body ?? undefined,
          data: message.link ? { link: message.link } : undefined,
          sound: "default",
        }))
      ),
    });
    const json = await res.json().catch(() => null);
    const tickets: ExpoPushTicket[] = json?.data ?? [];

    // A token Expo reports as no-longer-registered (app uninstalled, or
    // the device's push credentials were reset) should stop being sent
    // to — otherwise every future notification keeps paying the cost of a
    // request that can never succeed.
    const deadTokens = tokens
      .filter((_, i) => tickets[i]?.details?.error === "DeviceNotRegistered")
      .map((t) => t.expo_token);
    if (deadTokens.length > 0) {
      await getSupabaseAdmin().from("push_tokens").delete().in("expo_token", deadTokens);
    }
  } catch {
    // push delivery is a nice-to-have side effect, not worth failing the
    // in-app notification (or whatever triggered it) over
  }
}
