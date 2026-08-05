import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadDeveloperHubData } from "@/lib/developer-data";
import { SkillRadarChart } from "@/components/skill-radar-chart";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToTemplate, summarizeAttempts, type AttemptRow, type TemplateRow } from "@/lib/skill-tests";
import { VerifiedSkillsPanel } from "@/components/verified-skills-panel";

export default async function SkillsPage() {
  const session = await getServerSession(authOptions);
  const { profile, skillFingerprint, activity } = await loadDeveloperHubData(
    session!.accessToken!
  );

  const supabase = getSupabaseAdmin();
  const [{ data: templateRows }, { data: attemptRows }] = await Promise.all([
    supabase.from("skill_test_templates").select("*, skill_test_questions(count)").eq("is_active", true).order("stack"),
    supabase.from("skill_test_attempts").select("*").eq("github_id", session!.githubId!).order("started_at", { ascending: false }),
  ]);

  const templates = (templateRows as TemplateRow[] | null)?.map(rowToTemplate) ?? [];
  const summaries = summarizeAttempts((attemptRows as AttemptRow[]) ?? []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-white">Skills</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-surface-border bg-background-elevated p-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-white">{profile.overallScore}%</span>
            <span className="text-sm text-text-secondary">Overall Score</span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">Top {profile.percentileRank}%</p>
          <h2 className="mt-4 text-sm font-semibold text-white">Skill Fingerprint</h2>
          <SkillRadarChart fingerprint={skillFingerprint} />
        </div>

        <div className="rounded-2xl border border-surface-border bg-background-elevated p-6">
          <h2 className="text-sm font-semibold text-white">Language Breakdown</h2>
          <div className="mt-4 flex flex-col gap-3">
            {activity.languageBreakdown.slice(0, 8).map((lang) => (
              <div key={lang.language}>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>{lang.language}</span>
                  <span>{lang.percentage}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface">
                  <div
                    className="h-2 rounded-full bg-primary-gradient"
                    style={{ width: `${Math.min(100, lang.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
            {activity.languageBreakdown.length === 0 && (
              <p className="text-sm text-text-muted">
                No language data yet — push some code to your public repos.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white">Verified Skills</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Short, proctored-free knowledge checks — a separate signal from the GitHub-derived
          fingerprint above, not blended into it.
        </p>
        <VerifiedSkillsPanel templates={templates} summaries={Object.fromEntries(summaries)} />
      </div>
    </div>
  );
}
