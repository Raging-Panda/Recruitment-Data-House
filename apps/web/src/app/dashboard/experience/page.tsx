import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToWorkExperience } from "@/lib/experience";
import { ExperienceManager } from "@/components/experience-manager";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_WORK_EXPERIENCE } from "@/lib/demo-data";

export default async function ExperiencePage() {
  const session = await getServerSession(authOptions);

  let entries;
  if (isDemoAccount(session!.githubId)) {
    entries = DEMO_WORK_EXPERIENCE;
  } else {
    const { data, error } = await getSupabaseAdmin()
      .from("work_experience")
      .select("*")
      .eq("github_id", session!.githubId!)
      .order("start_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to load work experience: ${error.message}`);
    }
    entries = data.map(rowToWorkExperience);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-heading">Experience</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Your work history — entered manually, since this isn&apos;t something GitHub can tell us.
      </p>

      <ExperienceManager initialEntries={entries} />
    </div>
  );
}
