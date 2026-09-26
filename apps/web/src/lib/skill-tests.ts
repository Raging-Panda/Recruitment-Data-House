import type {
  SkillTestAttempt,
  SkillTestAttemptStatus,
  SkillTestAttemptSummary,
  SkillTestLevel,
  SkillTestQuestion,
  SkillTestTemplate,
} from "@ipskill/shared";

export interface TemplateRow {
  id: string;
  slug: string;
  title: string;
  stack: string;
  description: string;
  time_limit_seconds: number;
  is_active: boolean;
  level: SkillTestLevel | null;
  level_order: number | null;
  target_question_count: number | null;
  skill_test_questions?: { count: number }[];
}

export interface QuestionRow {
  id: string;
  template_id: string;
  question_text: string;
  choices: string[];
  correct_index: number;
  points: number;
  order_index: number;
}

export interface AttemptRow {
  id: string;
  github_id: string;
  template_id: string;
  status: SkillTestAttemptStatus;
  served_question_ids: string[];
  answers: Record<string, number> | null;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  started_at: string;
  submitted_at: string | null;
}

export function rowToTemplate(row: TemplateRow): SkillTestTemplate {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    stack: row.stack,
    description: row.description,
    timeLimitSeconds: row.time_limit_seconds,
    questionCount: row.skill_test_questions?.[0]?.count ?? 0,
    level: row.level,
    levelOrder: row.level_order,
    targetQuestionCount: row.target_question_count,
  };
}

export function rowToPublicQuestion(row: QuestionRow): SkillTestQuestion {
  return {
    id: row.id,
    questionText: row.question_text,
    choices: row.choices,
  };
}

export function rowToAttempt(row: AttemptRow): SkillTestAttempt {
  return {
    id: row.id,
    templateId: row.template_id,
    status: row.status,
    score: row.score,
    maxScore: row.max_score,
    percentage: row.percentage,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
  };
}

/** Groups a candidate's attempts into one summary per template for the Skills page list. */
export function summarizeAttempts(attempts: AttemptRow[]): Map<string, SkillTestAttemptSummary> {
  const byTemplate = new Map<string, AttemptRow[]>();
  for (const attempt of attempts) {
    const list = byTemplate.get(attempt.template_id) ?? [];
    list.push(attempt);
    byTemplate.set(attempt.template_id, list);
  }

  const summaries = new Map<string, SkillTestAttemptSummary>();
  for (const [templateId, list] of byTemplate) {
    const inProgress = list.find((a) => a.status === "in_progress");
    const completed = list.filter((a) => a.percentage !== null);
    const best = completed.reduce<AttemptRow | null>(
      (acc, a) => (acc === null || (a.percentage ?? 0) > (acc.percentage ?? 0) ? a : acc),
      null
    );

    if (inProgress) {
      summaries.set(templateId, {
        templateId,
        status: "in_progress",
        bestPercentage: best?.percentage ?? null,
        latestAttemptId: inProgress.id,
        completedAt: best?.submitted_at ?? null,
      });
    } else if (best) {
      summaries.set(templateId, {
        templateId,
        status: best.status,
        bestPercentage: best.percentage,
        latestAttemptId: best.id,
        completedAt: best.submitted_at,
      });
    } else {
      const mostRecent = list[0];
      summaries.set(templateId, {
        templateId,
        status: mostRecent.status,
        bestPercentage: null,
        latestAttemptId: mostRecent.id,
        completedAt: null,
      });
    }
  }

  return summaries;
}

/** Fisher-Yates — served question order is shuffled per attempt so a shared
 * answer key ("Q1: B, Q2: D...") is less directly reusable between candidates. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function isAttemptExpired(attempt: AttemptRow, timeLimitSeconds: number): boolean {
  const elapsedMs = Date.now() - new Date(attempt.started_at).getTime();
  return elapsedMs > timeLimitSeconds * 1000;
}

/** Same 70% bar the activity feed already uses to decide a completed
 * attempt is worth recording as a real event (see the skill-tests submit
 * route) — reused here so "verified" means the same thing everywhere. */
export const VERIFIED_SKILL_THRESHOLD = 70;

export interface VerifiedSkillMilestone {
  templateId: string;
  title: string;
  percentage: number;
  submittedAt: string;
}

/**
 * One entry per skill a candidate has ever passed, for the Career
 * Timeline — not one per attempt, so retakes don't spam the timeline.
 * Dated by the *first* passing attempt (when they actually got verified),
 * but shows the best score they've since achieved. Pure transform; the
 * caller queries skill_test_attempts/skill_test_templates itself, same
 * division of labor as the rest of this file.
 */
export function buildVerifiedSkillMilestones(
  attempts: { template_id: string; percentage: number | null; submitted_at: string | null }[],
  templateTitles: Map<string, string>
): VerifiedSkillMilestone[] {
  const best = new Map<string, { percentage: number; submittedAt: string }>();
  for (const a of attempts) {
    if (a.percentage === null || a.submitted_at === null || a.percentage < VERIFIED_SKILL_THRESHOLD) {
      continue;
    }
    const existing = best.get(a.template_id);
    if (!existing) {
      best.set(a.template_id, { percentage: a.percentage, submittedAt: a.submitted_at });
    } else {
      best.set(a.template_id, {
        percentage: Math.max(existing.percentage, a.percentage),
        submittedAt: a.submitted_at < existing.submittedAt ? a.submitted_at : existing.submittedAt,
      });
    }
  }
  return [...best.entries()].map(([templateId, v]) => ({
    templateId,
    title: templateTitles.get(templateId) ?? "Verified skill",
    percentage: v.percentage,
    submittedAt: v.submittedAt,
  }));
}
