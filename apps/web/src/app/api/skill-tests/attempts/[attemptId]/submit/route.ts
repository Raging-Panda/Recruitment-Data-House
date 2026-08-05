import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAttemptExpired, type AttemptRow, type QuestionRow, type TemplateRow } from "@/lib/skill-tests";
import type { SkillTestSubmitResult } from "@ipskill/shared";

export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: attempt, error: attemptError } = await supabase
    .from("skill_test_attempts")
    .select("*")
    .eq("id", params.attemptId)
    .eq("github_id", session.githubId)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  const attemptRow = attempt as AttemptRow;

  if (attemptRow.status !== "in_progress") {
    return NextResponse.json({ error: "This attempt was already submitted" }, { status: 409 });
  }

  const { data: template, error: templateError } = await supabase
    .from("skill_test_templates")
    .select("*")
    .eq("id", attemptRow.template_id)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }
  const templateRow = template as TemplateRow;

  const body = await req.json();
  const answers: Record<string, number> = body?.answers ?? {};

  const { data: questions, error: questionsError } = await supabase
    .from("skill_test_questions")
    .select("*")
    .in("id", attemptRow.served_question_ids);

  if (questionsError || !questions) {
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }

  // Scored server-side against correct_index, which is never sent to the
  // client — the /start route only ever returns question text and choices.
  let score = 0;
  let maxScore = 0;
  for (const q of questions as QuestionRow[]) {
    maxScore += q.points;
    if (answers[q.id] === q.correct_index) {
      score += q.points;
    }
  }
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const expired = isAttemptExpired(attemptRow, templateRow.time_limit_seconds);

  const { data: updated, error: updateError } = await supabase
    .from("skill_test_attempts")
    .update({
      status: expired ? "expired" : "completed",
      answers,
      score,
      max_score: maxScore,
      percentage,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptRow.id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const result: SkillTestSubmitResult = {
    attemptId: (updated as AttemptRow).id,
    status: (updated as AttemptRow).status,
    score,
    maxScore,
    percentage,
  };
  return NextResponse.json(result);
}
