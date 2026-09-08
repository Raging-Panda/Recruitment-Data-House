import type {
  DeveloperProject,
  LanguageBreakdownEntry,
  SkillFingerprint,
  WorkExperience,
} from "@ipskill/shared";
import { NextPositionCard } from "@/components/next-position-card";
import { suggestNextPositions } from "@/lib/position-suggestions";
import { isDemoAccount } from "@/lib/demo-mode";
import { isTestAccount } from "@/lib/test-mode";
import { DEMO_WORK_EXPERIENCE } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToWorkExperience } from "@/lib/experience";

/**
 * Async Server Component rendered inside its own <Suspense> boundary on the
 * Analytics page — computing a suggestion needs an extra work_experience
 * fetch beyond the core loadDeveloperHubData result every other section on
 * the page uses, so isolating it here lets the rest of the page stream in
 * without waiting on it too.
 */
export async function NextPositionSuggestionsSection({
  githubId,
  skillFingerprint,
  languageBreakdown,
  projects,
  overallScore,
}: {
  githubId: string;
  skillFingerprint: SkillFingerprint;
  languageBreakdown: LanguageBreakdownEntry[];
  projects: DeveloperProject[];
  overallScore: number;
}) {
  let workExperience: WorkExperience[] = [];
  if (isDemoAccount(githubId)) {
    workExperience = DEMO_WORK_EXPERIENCE;
  } else if (!isTestAccount(githubId)) {
    try {
      const { data } = await getSupabaseAdmin().from("work_experience").select("*").eq("github_id", githubId);
      workExperience = (data ?? []).map(rowToWorkExperience);
    } catch {
      // position suggestions degrade gracefully to GitHub-only signals below
    }
  }

  const nextPositions = suggestNextPositions({
    skillFingerprint,
    languageBreakdown,
    projects,
    workExperience,
    overallScore,
  });

  return <NextPositionCard suggestions={nextPositions} />;
}
