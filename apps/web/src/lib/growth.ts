import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDirectoryEntriesByIds } from "@/lib/directory";

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
 */
export async function getGrowthLeaderboard(limit = 20): Promise<GrowthEntry[]> {
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

  const ownerIds = [...byOwner.keys()];
  if (ownerIds.length === 0) return [];

  const [{ data: positions }, { data: certs }, { data: attempts }, entries] = await Promise.all([
    supabase.from("work_experience").select("github_id").in("github_id", ownerIds).gte("created_at", since),
    supabase.from("certifications").select("github_id").in("github_id", ownerIds).gte("created_at", since),
    supabase
      .from("skill_test_attempts")
      .select("github_id")
      .in("github_id", ownerIds)
      .eq("status", "completed")
      .gte("submitted_at", since),
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
  const attemptCounts = countBy(attempts);

  const result: GrowthEntry[] = ownerIds.map((githubId) => {
    const snap = byOwner.get(githubId)!;
    const scoreDelta = snap.last - snap.first;
    const newPositions = positionCounts.get(githubId) ?? 0;
    const newCertifications = certCounts.get(githubId) ?? 0;
    const skillsLeveledUp = attemptCounts.get(githubId) ?? 0;
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
  const [board, publicEntries] = await Promise.all([getGrowthLeaderboard(100), getPublicDirectoryEntries()]);
  const publicIds = new Set(publicEntries.map((e) => e.githubId));
  return board.filter((e) => publicIds.has(e.githubId) && e.growthScore > 0).slice(0, limit);
}
