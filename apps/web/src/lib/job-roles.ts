import "server-only";
import type { SkillFingerprint, SkillCategory } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface JobRole {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  requiredSkills: Partial<SkillFingerprint>;
  createdAt: string;
}

interface JobRoleRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  required_skills: Partial<SkillFingerprint>;
  created_at: string;
}

function rowToRole(row: JobRoleRow): JobRole {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    description: row.description,
    requiredSkills: row.required_skills ?? {},
    createdAt: row.created_at,
  };
}

export async function listJobRoles(): Promise<JobRole[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("job_roles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as JobRoleRow[]).map(rowToRole);
}

export async function createJobRole(input: {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  requiredSkills: Partial<SkillFingerprint>;
}): Promise<JobRole> {
  const { data, error } = await getSupabaseAdmin()
    .from("job_roles")
    .insert({
      title: input.title,
      company: input.company,
      location: input.location,
      description: input.description,
      required_skills: input.requiredSkills,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToRole(data as JobRoleRow);
}

/** Simple weighted overlap — how well a candidate's fingerprint covers
 * what a role asks for, not a substitute for real screening (see
 * PLAN.md's "one input alongside manual screening" positioning). */
export function computeRoleMatch(fingerprint: SkillFingerprint, requiredSkills: Partial<SkillFingerprint>): number {
  const entries = Object.entries(requiredSkills) as [SkillCategory, number][];
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, [category, required]) => {
    const have = fingerprint[category] ?? 0;
    return sum + Math.min(1, have / Math.max(1, required));
  }, 0);
  return Math.round((total / entries.length) * 100);
}
