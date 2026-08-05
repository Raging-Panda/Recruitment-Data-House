import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToTemplate, summarizeAttempts, type AttemptRow, type TemplateRow } from "@/lib/skill-tests";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const [{ data: templates, error: templatesError }, { data: attempts, error: attemptsError }] =
    await Promise.all([
      supabase
        .from("skill_test_templates")
        .select("*, skill_test_questions(count)")
        .eq("is_active", true)
        .order("stack", { ascending: true }),
      supabase
        .from("skill_test_attempts")
        .select("*")
        .eq("github_id", session.githubId)
        .order("started_at", { ascending: false }),
    ]);

  if (templatesError) {
    return NextResponse.json({ error: templatesError.message }, { status: 500 });
  }
  if (attemptsError) {
    return NextResponse.json({ error: attemptsError.message }, { status: 500 });
  }

  const summaries = summarizeAttempts(attempts as AttemptRow[]);

  return NextResponse.json({
    templates: (templates as TemplateRow[]).map(rowToTemplate),
    summaries: Object.fromEntries(summaries),
  });
}
