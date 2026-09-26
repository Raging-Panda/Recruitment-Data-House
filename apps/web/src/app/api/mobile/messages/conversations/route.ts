import { NextRequest, NextResponse } from "next/server";
import { resolveMobileGithubId } from "@/lib/mobile-auth";
import { listConversations } from "@/lib/messaging";
import { getDirectoryEntriesByIds } from "@/lib/directory";

/** Enriched with the other participant's display name/avatar — the
 * mobile app has no directory-fetching of its own, so this saves it a
 * second round trip per conversation rather than returning bare ids. */
export async function GET(req: NextRequest) {
  const githubId = await resolveMobileGithubId(req);
  if (!githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const conversations = await listConversations(githubId).catch(() => []);
  const others = await getDirectoryEntriesByIds(conversations.map((c) => c.otherId)).catch(() => []);
  const otherMap = new Map(others.map((o) => [o.githubId, o]));

  const enriched = conversations.map((c) => ({
    ...c,
    otherName: otherMap.get(c.otherId)?.displayName ?? "A developer",
    otherAvatarUrl: otherMap.get(c.otherId)?.avatarUrl ?? null,
  }));

  return NextResponse.json({ conversations: enriched });
}
