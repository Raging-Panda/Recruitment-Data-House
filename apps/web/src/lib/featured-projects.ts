import type { FeaturedProject } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_FEATURED_PROJECTS } from "@/lib/demo-data";

interface FeaturedProjectRow {
  id: string;
  github_id: string;
  repo_name: string;
  repo_url: string | null;
  blurb: string;
  languages: string[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function rowToFeaturedProject(row: FeaturedProjectRow): FeaturedProject {
  return {
    id: row.id,
    githubId: row.github_id,
    repoName: row.repo_name,
    repoUrl: row.repo_url,
    blurb: row.blurb,
    languages: row.languages ?? [],
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const FEATURED_PROJECT_SELECT =
  "id, github_id, repo_name, repo_url, blurb, languages, sort_order, created_at, updated_at";

/** Max pins a developer can feature — enough to tell a story, few enough
 * that the list stays curated rather than a second repo dump. */
export const MAX_FEATURED_PROJECTS = 6;

export async function getFeaturedProjects(githubId: string): Promise<FeaturedProject[]> {
  if (isDemoAccount(githubId)) return DEMO_FEATURED_PROJECTS;

  const { data, error } = await getSupabaseAdmin()
    .from("featured_projects")
    .select(FEATURED_PROJECT_SELECT)
    .eq("github_id", githubId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as FeaturedProjectRow[]).map(rowToFeaturedProject);
}

/** Read-through variant for pages where a Supabase hiccup shouldn't take
 * the whole Profile page down with it. */
export async function getFeaturedProjectsSafe(githubId: string): Promise<FeaturedProject[]> {
  try {
    return await getFeaturedProjects(githubId);
  } catch {
    return [];
  }
}
