import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDirectoryEntriesByIds } from "@/lib/directory";
import { VERIFIED_SKILL_THRESHOLD } from "@/lib/skill-tests";

const WINDOW_DAYS = 30;

export interface GrowthEntry {
  githubId: string;
  displayName: string;
  avatarUrl: string | null;
  scoreDelta: number;
  newPositions: number;
  newCertifications: number;
  skillsLeveledUp: number;
  growthScore: number;
}

/**
 * Month-over-month growth leaderboard. Weighted rather than a plain score
 * delta, per the original ask: raw fingerprint movement plus bonus weight
 * for concrete, harder-to-game milestones (a new role, a new certification,
 * a newly-passed verified skill test) — someone padding commits alone
 * doesn't out-rank someone who actually leveled up.
 *
 * Growth Olympics is a Premium Dev competition, so by default only
 * premium_dev accounts are ranked; the public Trending surface passes
 * `premiumDevOnly: false` to rank every account.
 */
export async function getGrowthLeaderboard(
  limit = 20,
  { premiumDevOnly = true }: { premiumDevOnly?: boolean } = {}
): Promise<GrowthEntry[]> {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: snapshots, error } = await supabase
    .from("score_snapshots")
    .select("owner_id, overall_score, captured_at")
    .gte("captured_at", since)
    .order("captured_at", { ascending: true });
  if (error) throw new Error(error.message);

  const byOwner = new Map<string, { first: number; last: number }>();
  for (const row of snapshots ?? []) {
    const existing = byOwner.get(row.owner_id);
    if (!existing) byOwner.set(row.owner_id, { first: row.overall_score, last: row.overall_score });
    else existing.last = row.overall_score;
  }

  let ownerIds = [...byOwner.keys()];
  if (premiumDevOnly && ownerIds.length > 0) {
    const { data: premium, error: planError } = await supabase
      .from("candidate_profile")
      .select("github_id")
      .in("github_id", ownerIds)
      .eq("plan", "premium_dev");
    if (planError) throw new Error(planError.message);
    const premiumIds = new Set((premium ?? []).map((r: { github_id: string }) => r.github_id));
    ownerIds = ownerIds.filter((id) => premiumIds.has(id));
  }
  if (ownerIds.length === 0) return [];

  const [{ data: positions }, { data: certs }, { data: passes }, entries] = await Promise.all([
    supabase.from("work_experience").select("github_id").in("github_id", ownerIds).gte("created_at", since),
    supabase.from("certifications").select("github_id").in("github_id", ownerIds).gte("created_at", since),
    // All-time passes, not just this window's: a test only counts the first
    // time it's passed, so re-passing one passed before the window (retakes
    // open up after the 7-day hold) or passing it twice inside it scores
    // nothing extra. A failed attempt never counts.
    supabase
      .from("skill_test_attempts")
      .select("github_id, template_id, submitted_at")
      .in("github_id", ownerIds)
      .eq("status", "completed")
      .gte("percentage", VERIFIED_SKILL_THRESHOLD),
    getDirectoryEntriesByIds(ownerIds),
  ]);
  const entryMap = new Map(entries.map((e) => [e.githubId, e]));

  const countBy = (rows: { github_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.github_id, (m.get(r.github_id) ?? 0) + 1);
    return m;
  };
  const positionCounts = countBy(positions);
  const certCounts = countBy(certs);

  const firstPassAt = new Map<string, { github_id: string; at: number }>();
  for (const p of (passes ?? []) as { github_id: string; template_id: string; submitted_at: string }[]) {
    const key = `${p.github_id}|${p.template_id}`;
    const at = Date.parse(p.submitted_at);
    const seen = firstPassAt.get(key);
    if (!seen || at < seen.at) firstPassAt.set(key, { github_id: p.github_id, at });
  }
  const sinceMs = Date.parse(since);
  const newPassCounts = countBy([...firstPassAt.values()].filter((p) => p.at >= sinceMs));

  const result: GrowthEntry[] = ownerIds.map((githubId) => {
    const snap = byOwner.get(githubId)!;
    const scoreDelta = snap.last - snap.first;
    const newPositions = positionCounts.get(githubId) ?? 0;
    const newCertifications = certCounts.get(githubId) ?? 0;
    const skillsLeveledUp = newPassCounts.get(githubId) ?? 0;
    const growthScore = scoreDelta * 1 + newPositions * 10 + newCertifications * 8 + skillsLeveledUp * 6;
    const entry = entryMap.get(githubId);
    return {
      githubId,
      displayName: entry?.displayName ?? "A developer",
      avatarUrl: entry?.avatarUrl ?? null,
      scoreDelta,
      newPositions,
      newCertifications,
      skillsLeveledUp,
      growthScore,
    };
  });

  return result.sort((a, b) => b.growthScore - a.growthScore).slice(0, limit);
}

/** Public "trending" surface — same computation, restricted to accounts
 * that opted into the public directory. Powers the discovery angle for
 * strong-but-unknown developers, separate from the premium-gated
 * full leaderboard. */
export async function getPublicTrendingDevelopers(limit = 5): Promise<GrowthEntry[]> {
  const { getPublicDirectoryEntries } = await import("@/lib/directory");
  const [board, publicEntries] = await Promise.all([
    getGrowthLeaderboard(100, { premiumDevOnly: false }),
    getPublicDirectoryEntries(),
  ]);
  const publicIds = new Set(publicEntries.map((e) => e.githubId));
  return board.filter((e) => publicIds.has(e.githubId) && e.growthScore > 0).slice(0, limit);
}
