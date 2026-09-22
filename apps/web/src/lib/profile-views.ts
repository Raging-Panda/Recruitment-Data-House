import type { ProfileViewStats } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

/**
 * Best-effort — a Supabase hiccup here shouldn't break loading the profile
 * being viewed. Self-views (viewing your own profile) don't count.
 *
 * Notifies the viewed candidate, but only on the first-ever view from a
 * given viewer — every repeat view from the same recruiter would otherwise
 * spam a push notification for something that's already surfaced in the
 * Analytics view-count stat.
 */
export async function recordProfileView(
  viewedGithubId: string,
  viewerGithubId: string | null
): Promise<void> {
  if (viewerGithubId === viewedGithubId) return;
  try {
    const supabase = getSupabaseAdmin();
    let isNewViewer = false;
    if (viewerGithubId) {
      const { count } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("viewed_github_id", viewedGithubId)
        .eq("viewer_github_id", viewerGithubId);
      isNewViewer = (count ?? 0) === 0;
    }
    await supabase.from("profile_views").insert({
      viewed_github_id: viewedGithubId,
      viewer_github_id: viewerGithubId,
    });
    if (isNewViewer) {
      void createNotification(viewedGithubId, {
        type: "profile_viewed",
        title: "Someone viewed your profile",
        body: "A recruiter checked out your IPSkill profile.",
        link: "/dashboard/analytics",
      });
    }
  } catch {
    // view counts are a nice-to-have, not worth failing the page over
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getProfileViewStats(githubId: string): Promise<ProfileViewStats> {
  const now = Date.now();
  const last30Start = new Date(now - 30 * DAY_MS).toISOString();
  const prior30Start = new Date(now - 60 * DAY_MS).toISOString();

  const supabase = getSupabaseAdmin();
  const [{ count: total }, { count: last30Days }, { count: prior30Days }] = await Promise.all([
    supabase
      .from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("viewed_github_id", githubId),
    supabase
      .from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("viewed_github_id", githubId)
      .gte("created_at", last30Start),
    supabase
      .from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("viewed_github_id", githubId)
      .gte("created_at", prior30Start)
      .lt("created_at", last30Start),
  ]);

  const prior = prior30Days ?? 0;
  const recent = last30Days ?? 0;
  const changePct = prior > 0 ? Math.round(((recent - prior) / prior) * 1000) / 10 : null;

  return { total: total ?? 0, last30Days: recent, changePct };
}
