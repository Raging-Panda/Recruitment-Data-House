import "server-only";
import type { SkillCategory } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";

export interface SkillProof {
  id: string;
  githubId: string;
  skillCategory: SkillCategory;
  title: string;
  url: string;
  createdAt: string;
}

interface SkillProofRow {
  id: string;
  owner_id: string;
  skill_category: SkillCategory;
  title: string;
  url: string;
  created_at: string;
}

export const SKILL_PROOF_SELECT = "id, owner_id, skill_category, title, url, created_at";

function rowToProof(row: SkillProofRow): SkillProof {
  return {
    id: row.id,
    githubId: row.owner_id,
    skillCategory: row.skill_category,
    title: row.title,
    url: row.url,
    createdAt: row.created_at,
  };
}

const DEMO_PROOFS: SkillProof[] = [
  {
    id: "demo-proof-1",
    githubId: "900000002",
    skillCategory: "Backend",
    title: "Merged PR: transactional outbox for payment retries",
    url: "https://example.com/pr/outbox",
    createdAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "demo-proof-2",
    githubId: "900000002",
    skillCategory: "Cloud",
    title: "outbox-go — published Go package",
    url: "https://pkg.go.dev/example.com/outbox-go",
    createdAt: "2026-05-10T00:00:00Z",
  },
];

export async function getSkillProofsFor(githubId: string): Promise<SkillProof[]> {
  if (isDemoAccount(githubId)) return DEMO_PROOFS;
  const { data, error } = await getSupabaseAdmin()
    .from("skill_proofs")
    .select(SKILL_PROOF_SELECT)
    .eq("owner_id", githubId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as SkillProofRow[]).map(rowToProof);
}

export async function getSkillProofsForSafe(githubId: string): Promise<SkillProof[]> {
  try {
    return await getSkillProofsFor(githubId);
  } catch {
    return [];
  }
}
