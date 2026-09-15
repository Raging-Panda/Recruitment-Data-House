import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface ActivityEvent {
  id: string;
  ownerId: string;
  type: string;
  title: string;
  body: string | null;
  occurredAt: string;
  kudosCount: number;
  kudosedByMe: boolean;
}

/** Best-effort — mirrors notifications.ts: a hiccup here shouldn't fail
 * the save/submit it's attached to. */
export async function recordActivityEvent(
  ownerId: string,
  event: { type: string; title: string; body?: string | null }
): Promise<void> {
  try {
    await getSupabaseAdmin().from("activity_events").insert({
      owner_id: ownerId,
      type: event.type,
      title: event.title,
      body: event.body ?? null,
    });
  } catch {
    // non-critical
  }
}

export async function follow(followerId: string, followeeId: string): Promise<void> {
  if (followerId === followeeId) throw new Error("Can't follow yourself");
  const { error } = await getSupabaseAdmin()
    .from("follows")
    .upsert({ follower_id: followerId, followee_id: followeeId }, { onConflict: "follower_id,followee_id" });
  if (error) throw new Error(error.message);
}

export async function unfollow(followerId: string, followeeId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId);
  if (error) throw new Error(error.message);
}

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId)
    .maybeSingle();
  return Boolean(data);
}

export async function getFollowingIds(followerId: string): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("follows")
    .select("followee_id")
    .eq("follower_id", followerId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.followee_id as string);
}

/** Feed of the people `viewerId` follows — most recent events first,
 * capped since this is a dashboard widget, not a paginated timeline. */
export async function getFollowingFeed(viewerId: string, limit = 30): Promise<ActivityEvent[]> {
  const followingIds = await getFollowingIds(viewerId);
  if (followingIds.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("activity_events")
    .select("id, owner_id, type, title, body, occurred_at")
    .in("owner_id", followingIds)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const eventIds = (data ?? []).map((e) => e.id);
  const { data: kudosRows } = eventIds.length
    ? await supabase.from("kudos").select("event_id, from_id").in("event_id", eventIds)
    : { data: [] as { event_id: string; from_id: string }[] };

  return (data ?? []).map((row) => ({
    id: row.id,
    ownerId: row.owner_id,
    type: row.type,
    title: row.title,
    body: row.body,
    occurredAt: row.occurred_at,
    kudosCount: (kudosRows ?? []).filter((k) => k.event_id === row.id).length,
    kudosedByMe: (kudosRows ?? []).some((k) => k.event_id === row.id && k.from_id === viewerId),
  }));
}

export async function giveKudos(fromId: string, eventId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("kudos")
    .upsert({ from_id: fromId, event_id: eventId }, { onConflict: "from_id,event_id" });
  if (error) throw new Error(error.message);
}

export async function removeKudos(fromId: string, eventId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("kudos").delete().eq("from_id", fromId).eq("event_id", eventId);
  if (error) throw new Error(error.message);
}
