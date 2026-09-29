import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  isAttemptExpired,
  rowToPublicQuestion,
  shuffle,
  type AttemptRow,
  type QuestionRow,
  type TemplateRow,
} from "@/lib/skill-tests";
import type { SkillTestStartResponse } from "@ipskill/shared";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";

export async function POST(_req: Request, { params }: { params: { templateId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const supabase = getSupabaseAdmin();

  const { data: template, error: templateError } = await supabase
    .from("skill_test_templates")
    .select("*")
    .eq("id", params.templateId)
    .eq("is_active", true)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }
  const templateRow = template as TemplateRow;

  const { data: existing } = await supabase
    .from("skill_test_attempts")
    .select("*")
    .eq("github_id", session.githubId)
    .eq("template_id", templateRow.id)
    .eq("status", "in_progress")
    .maybeSingle();

  const existingAttempt = existing as AttemptRow | null;

  if (existingAttempt) {
    if (!isAttemptExpired(existingAttempt, templateRow.time_limit_seconds)) {
      // Resume the in-progress attempt with the same question set/order it
      // was started with, so refreshing mid-test doesn't reshuffle questions.
      const { data: questions, error: questionsError } = await supabase
        .from("skill_test_questions")
        .select("id, template_id, question_text, choices, order_index")
        .in("id", existingAttempt.served_question_ids);

      if (questionsError) {
        return NextResponse.json({ error: questionsError.message }, { status: 500 });
      }

      const byId = new Map((questions as QuestionRow[]).map((q) => [q.id, q]));
      const response: SkillTestStartResponse = {
        attemptId: existingAttempt.id,
        timeLimitSeconds: templateRow.time_limit_seconds,
        startedAt: existingAttempt.started_at,
        questions: existingAttempt.served_question_ids
          .map((id) => byId.get(id))
          .filter((q): q is QuestionRow => q !== undefined)
          .map(rowToPublicQuestion),
      };
      return NextResponse.json(response);
    }

    await supabase
      .from("skill_test_attempts")
      .update({ status: "expired" })
      .eq("id", existingAttempt.id);
  }

  const { data: allQuestions, error: allQuestionsError } = await supabase
    .from("skill_test_questions")
    .select("*")
    .eq("template_id", templateRow.id)
    .order("order_index", { ascending: true });

  if (allQuestionsError || !allQuestions?.length) {
    return NextResponse.json({ error: "This test has no questions yet" }, { status: 500 });
  }

  // Sample target_question_count at random from the bank once it's grown
  // past that size, instead of always serving every question — falls back
  // to the whole (shuffled) bank when no target is set or the bank hasn't
  // outgrown it yet, so this is a no-op for today's smaller banks.
  const shuffled = shuffle(allQuestions as QuestionRow[]);
  const serveCount =
    templateRow.target_question_count && templateRow.target_question_count > 0
      ? Math.min(templateRow.target_question_count, shuffled.length)
      : shuffled.length;
  const servedQuestions = shuffled.slice(0, serveCount);
  const servedQuestionIds = servedQuestions.map((q) => q.id);

  const { data: newAttempt, error: insertError } = await supabase
    .from("skill_test_attempts")
    .insert({
      github_id: session.githubId,
      template_id: templateRow.id,
      status: "in_progress",
      served_question_ids: servedQuestionIds,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const response: SkillTestStartResponse = {
    attemptId: (newAttempt as AttemptRow).id,
    timeLimitSeconds: templateRow.time_limit_seconds,
    startedAt: (newAttempt as AttemptRow).started_at,
    questions: servedQuestions.map(rowToPublicQuestion),
  };
  return NextResponse.json(response);
}
