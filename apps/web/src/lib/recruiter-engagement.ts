import { getSupabaseAdmin } from "@/lib/supabase";
import { getDirectoryEntriesByIds } from "@/lib/directory";

export interface CandidateEngagement {
  githubId: string;
  displayName: string;
  avatarUrl: string | null;
  shortlistNames: string[];
  addedAt: string;
  viewCount: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  timeToFirstViewHours: number | null;
}

export interface RecruiterEngagementSummary {
  totalShortlisted: number;
  viewedCount: number;
  viewedPct: number;
  avgTimeToFirstViewHours: number | null;
  candidates: CandidateEngagement[];
}

const EMPTY_SUMMARY: RecruiterEngagementSummary = {
  totalShortlisted: 0,
  viewedCount: 0,
  viewedPct: 0,
  avgTimeToFirstViewHours: null,
  candidates: [],
};

const HOUR_MS = 60 * 60 * 1000;

/**
 * The inverse of the candidate's own Analytics screen: for a recruiter,
 * which of their shortlisted candidates have they actually engaged with?
 * Built entirely from data we already have — shortlist_candidates.added_at
 * (when shortlisted) and profile_views (this recruiter's own views of that
 * candidate, via the Directory detail page) — no separate "contacted"
 * concept exists yet since real messaging isn't built.
 */
export async function getRecruiterEngagement(recruiterGithubId: string): Promise<RecruiterEngagementSummary> {
  const supabase = getSupabaseAdmin();

  const { data: shortlists, error: shortlistsError } = await supabase
    .from("shortlists")
    .select("id, name")
    .eq("owner_github_id", recruiterGithubId);
  if (shortlistsError) throw new Error(shortlistsError.message);
  if (!shortlists || shortlists.length === 0) return EMPTY_SUMMARY;

  const shortlistIds = shortlists.map((s) => s.id);
  const shortlistNameById = new Map(shortlists.map((s) => [s.id, s.name as string]));

  const { data: members, error: membersError } = await supabase
    .from("shortlist_candidates")
    .select("shortlist_id, candidate_github_id, added_at")
    .in("shortlist_id", shortlistIds);
  if (membersError) throw new Error(membersError.message);
  if (!members || members.length === 0) return EMPTY_SUMMARY;

  const byCandidate = new Map<string, { addedAt: string; shortlistNames: string[] }>();
  for (const m of members) {
    const name = shortlistNameById.get(m.shortlist_id) ?? "Unknown list";
    const existing = byCandidate.get(m.candidate_github_id);
    if (!existing) {
      byCandidate.set(m.candidate_github_id, { addedAt: m.added_at, shortlistNames: [name] });
    } else {
      if (new Date(m.added_at) < new Date(existing.addedAt)) existing.addedAt = m.added_at;
      if (!existing.shortlistNames.includes(name)) existing.shortlistNames.push(name);
    }
  }

  const candidateIds = [...byCandidate.keys()];

  const { data: views, error: viewsError } = await supabase
    .from("profile_views")
    .select("viewed_github_id, created_at")
    .eq("viewer_github_id", recruiterGithubId)
    .in("viewed_github_id", candidateIds)
    .order("created_at", { ascending: true });
  if (viewsError) throw new Error(viewsError.message);

  const viewsByCandidate = new Map<string, string[]>();
  for (const v of views ?? []) {
    const list = viewsByCandidate.get(v.viewed_github_id) ?? [];
    list.push(v.created_at);
    viewsByCandidate.set(v.viewed_github_id, list);
  }

  const entries = await getDirectoryEntriesByIds(candidateIds).catch(() => []);
  const entryById = new Map(entries.map((e) => [e.githubId, e]));

  const candidates: CandidateEngagement[] = candidateIds
    .map((id) => {
      const info = byCandidate.get(id)!;
      const entry = entryById.get(id);
      const candidateViews = viewsByCandidate.get(id) ?? [];
      const firstViewedAt = candidateViews[0] ?? null;
      const lastViewedAt = candidateViews.length ? candidateViews[candidateViews.length - 1] : null;
      const timeToFirstViewHours = firstViewedAt
        ? Math.round((new Date(firstViewedAt).getTime() - new Date(info.addedAt).getTime()) / HOUR_MS)
        : null;

      return {
        githubId: id,
        displayName: entry?.displayName ?? "Unknown developer",
        avatarUrl: entry?.avatarUrl ?? null,
        shortlistNames: info.shortlistNames,
        addedAt: info.addedAt,
        viewCount: candidateViews.length,
        firstViewedAt,
        lastViewedAt,
        timeToFirstViewHours,
      };
    })
    .sort((a, b) => b.viewCount - a.viewCount || new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

  const viewedCount = candidates.filter((c) => c.viewCount > 0).length;
  const timesToFirstView = candidates
    .map((c) => c.timeToFirstViewHours)
    .filter((v): v is number => v !== null);
  const avgTimeToFirstViewHours = timesToFirstView.length
    ? Math.round(timesToFirstView.reduce((a, b) => a + b, 0) / timesToFirstView.length)
    : null;

  return {
    totalShortlisted: candidates.length,
    viewedCount,
    viewedPct: candidates.length ? Math.round((viewedCount / candidates.length) * 100) : 0,
    avgTimeToFirstViewHours,
    candidates,
  };
}
