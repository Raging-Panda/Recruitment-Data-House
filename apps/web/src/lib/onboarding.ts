import type { DeveloperProfile } from "@ipskill/shared";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface OnboardingItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
  external: boolean;
}

export interface OnboardingChecklist {
  items: OnboardingItem[];
  percentage: number;
}

/**
 * Backs the Profile page's completion checklist. Resilient to Supabase
 * hiccups the same way getCandidateProfileOverrideSafe is — the checklist
 * degrading to "not done yet" on the manually-entered steps shouldn't 500
 * the whole profile page.
 */
export async function getOnboardingChecklist(
  githubId: string,
  profile: DeveloperProfile,
  hasDisplayNameOverride: boolean
): Promise<OnboardingChecklist> {
  let hasExperience = false;
  let hasCertification = false;
  let hasSkillTest = false;

  try {
    const supabase = getSupabaseAdmin();
    const [{ count: experienceCount }, { count: certificationCount }, { count: skillTestCount }] =
      await Promise.all([
        supabase
          .from("work_experience")
          .select("*", { count: "exact", head: true })
          .eq("github_id", githubId),
        supabase
          .from("certifications")
          .select("*", { count: "exact", head: true })
          .eq("github_id", githubId),
        supabase
          .from("skill_test_attempts")
          .select("*", { count: "exact", head: true })
          .eq("github_id", githubId)
          .not("percentage", "is", null),
      ]);
    hasExperience = (experienceCount ?? 0) > 0;
    hasCertification = (certificationCount ?? 0) > 0;
    hasSkillTest = (skillTestCount ?? 0) > 0;
  } catch {
    // leave the three manually-entered steps as not-done rather than throwing
  }

  const items: OnboardingItem[] = [
    {
      id: "github",
      label: "Connect GitHub",
      done: true,
      href: `https://github.com/${profile.githubLogin}`,
      external: true,
    },
    {
      id: "display-name",
      label: "Set a display name",
      done: hasDisplayNameOverride,
      href: "/dashboard/profile",
      external: false,
    },
    {
      id: "bio",
      label: "Add a bio on GitHub",
      done: Boolean(profile.about),
      href: "https://github.com/settings/profile",
      external: true,
    },
    {
      id: "experience",
      label: "Add work experience",
      done: hasExperience,
      href: "/dashboard/experience",
      external: false,
    },
    {
      id: "certification",
      label: "Add a certification",
      done: hasCertification,
      href: "/dashboard/certifications",
      external: false,
    },
    {
      id: "skill-test",
      label: "Run a skill test",
      done: hasSkillTest,
      href: "/dashboard/skills",
      external: false,
    },
  ];

  const percentage = Math.round((items.filter((item) => item.done).length / items.length) * 100);

  return { items, percentage };
}
