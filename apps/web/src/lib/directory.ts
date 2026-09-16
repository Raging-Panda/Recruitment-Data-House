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
  handle: string | null;
  visibility: "private" | "public" | null;
  company: string | null;
  currently: string | null;
  currently_updated_at: string | null;
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
    handle: row.handle,
    visibility: row.visibility ?? "private",
    company: row.company,
    currently: row.currently,
    currentlyUpdatedAt: row.currently_updated_at,
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
  aboutOverride?: string | null,
  /** Vanity handle / public-index opt-in / company — see lib/public-identity.ts. */
  identity?: { handle: string | null; visibility: "private" | "public"; company: string | null },
  /** The authored "Currently" one-liner + its timestamp, when set — mirrors
   * candidate_profile.currently onto the directory snapshot so it shows up
   * anywhere the directory row is read (public profile, share link,
   * recruiter detail, Directory cards), not just the candidate's own
   * dashboard Profile page. */
  currently?: { text: string | null; updatedAt: string | null }
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
      handle: identity?.handle ?? null,
      visibility: identity?.visibility ?? "private",
      company: identity?.company ?? null,
      currently: currently?.text ?? null,
      currentlyUpdatedAt: currently?.updatedAt ?? null,
    };
    const supabase = getSupabaseAdmin();
    const baseRow = {
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
    };
    // handle/visibility/company (migration 0003) and currently/
    // currentlyUpdatedAt (migration 0008) each only exist once their own
    // migration has run — until then PostgREST 400s on the unknown
    // columns (PGRST204) and fails the *entire* upsert, not just those
    // fields, which would silently break directory sync altogether for
    // every account. Staged so an environment that has 0003 but not yet
    // 0008 keeps writing handle/visibility/company instead of that write
    // regressing back to baseRow-only the moment this field was added.
    const identityRow = { handle: entry.handle, visibility: entry.visibility, company: entry.company };
    const currentlyRow = { currently: entry.currently, currently_updated_at: entry.currentlyUpdatedAt };
    const { error: fullError } = await supabase
      .from("directory_profiles")
      .upsert({ ...baseRow, ...identityRow, ...currentlyRow });
    if (fullError?.code === "PGRST204") {
      const { error: identityOnlyError } = await supabase
        .from("directory_profiles")
        .upsert({ ...baseRow, ...identityRow });
      if (identityOnlyError?.code === "PGRST204") {
        await supabase.from("directory_profiles").upsert(baseRow);
      }
    }
    void notifySavedSearchMatches(entry);
    // One point-in-time score sample per sync — Growth Olympics and
    // "trending developers" both compute a delta over these rather than
    // needing a cron job. A few extra rows per profile visit is cheap;
    // deliberately no de-dupe/throttle here, simplicity over storage.
    //
    // Genuinely awaited, not "void"'d like notifySavedSearchMatches above —
    // supabase-js query builders are lazy thenables that only actually
    // dispatch their fetch() when something calls .then()/awaits them;
    // `void builder.insert(...)` discards the *result* of constructing the
    // request but never triggers it, so the row silently never gets
    // written. (notifySavedSearchMatches is safe to void because it's a
    // real async function that awaits its own Supabase calls internally —
    // the bug is specific to voiding a raw query-builder chain directly.)
    // syncDirectoryProfile itself is already called fire-and-forget from
    // its caller, so awaiting here doesn't block anything upstream.
    await supabase.from("score_snapshots").insert({ owner_id: githubId, overall_score: profile.overallScore });
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

/** Only returns a row that's both found by handle AND opted into public
 * visibility — a handle that exists but was later made private should
 * 404 exactly like one that never existed. */
export async function getDirectoryEntryByHandle(handle: string): Promise<DirectoryEntry | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("directory_profiles")
    .select("*")
    .eq("handle", handle)
    .eq("visibility", "public")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToDirectoryEntry(data as DirectoryRow) : null;
}

export async function getPublicDirectoryEntries(): Promise<DirectoryEntry[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("directory_profiles")
    .select("*")
    .eq("visibility", "public")
    .order("overall_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DirectoryRow[]).map(rowToDirectoryEntry);
}

export async function getPublicDirectoryEntriesByCompany(company: string): Promise<DirectoryEntry[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("directory_profiles")
    .select("*")
    .eq("visibility", "public")
    .ilike("company", company)
    .order("overall_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DirectoryRow[]).map(rowToDirectoryEntry);
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
