import type {
  DeveloperProfile,
  DeveloperActivitySummary,
  DirectoryEntry,
  SkillFingerprint,
} from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notifySavedSearchMatches } from "@/lib/saved-searches";

export interface DirectoryRow {
  github_id: string;
  github_login: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  overall_score: number;
  top_languages: string[];
  available_for_opportunities: boolean;
  about: string | null;
  last_active_at: string;
  skill_fingerprint: SkillFingerprint;
}

export function rowToDirectoryEntry(row: DirectoryRow): DirectoryEntry {
  return {
    githubId: row.github_id,
    githubLogin: row.github_login,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    headline: row.headline,
    location: row.location,
    overallScore: row.overall_score,
    topLanguages: row.top_languages,
    availableForOpportunities: row.available_for_opportunities,
    about: row.about,
    lastActiveAt: row.last_active_at,
    skillFingerprint: row.skill_fingerprint,
  };
}

/**
 * Refreshes this candidate's directory listing from their own real GitHub
 * data — the only place a directory row can legitimately be written from,
 * since we never hold another user's access token. Best-effort: a hiccup
 * here shouldn't affect the profile page it's called from.
 */
export async function syncDirectoryProfile(
  githubId: string,
  displayName: string,
  profile: DeveloperProfile,
  activity: DeveloperActivitySummary,
  skillFingerprint: SkillFingerprint,
  /** Developer-authored "About", when set — takes precedence over the
   * GitHub bio so the directory/public view shows what they actually
   * wrote about themselves. */
  aboutOverride?: string | null
): Promise<void> {
  try {
    const topLanguages = activity.languageBreakdown.slice(0, 3).map((l) => l.language);
    const entry: DirectoryEntry = {
      githubId,
      githubLogin: profile.githubLogin,
      displayName,
      avatarUrl: profile.avatarUrl,
      headline: profile.headline,
      location: profile.location,
      overallScore: profile.overallScore,
      topLanguages,
      availableForOpportunities: profile.availableForOpportunities,
      about: aboutOverride?.trim() || profile.about,
      lastActiveAt: new Date().toISOString(),
      skillFingerprint,
    };
    await getSupabaseAdmin().from("directory_profiles").upsert({
      github_id: entry.githubId,
      github_login: entry.githubLogin,
      display_name: entry.displayName,
      avatar_url: entry.avatarUrl,
      headline: entry.headline,
      location: entry.location,
      overall_score: entry.overallScore,
      top_languages: entry.topLanguages,
      available_for_opportunities: entry.availableForOpportunities,
      about: entry.about,
      last_active_at: entry.lastActiveAt,
      skill_fingerprint: entry.skillFingerprint,
    });
    void notifySavedSearchMatches(entry);
  } catch {
    // directory freshness is a nice-to-have side effect, not worth failing the profile page over
  }
}

export async function getDirectoryEntries(): Promise<DirectoryEntry[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("directory_profiles")
    .select("*")
    .order("last_active_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DirectoryRow[]).map(rowToDirectoryEntry);
}

export async function getDirectoryEntry(githubId: string): Promise<DirectoryEntry | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("directory_profiles")
    .select("*")
    .eq("github_id", githubId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToDirectoryEntry(data as DirectoryRow) : null;
}

export async function getDirectoryEntriesByIds(githubIds: string[]): Promise<DirectoryEntry[]> {
  if (githubIds.length === 0) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("directory_profiles")
    .select("*")
    .in("github_id", githubIds);

  if (error) throw new Error(error.message);
  return (data as DirectoryRow[]).map(rowToDirectoryEntry);
}
