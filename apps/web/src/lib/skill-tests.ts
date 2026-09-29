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

/** A passed, non-aced test can't be retaken until 7 days after the most
 * recent completed attempt — long enough to discourage grinding the same
 * bank, short enough that it's not a real barrier to re-verifying a skill. */
export const RETAKE_COOLDOWN_DAYS = 7;

/** Aced/cooldown state for one template, from that template's own attempts
 * only — shared between summarizeAttempts (display) and the /start route
 * (enforcement) so the two can't drift apart. `retakeAvailableAt` is null
 * once aced, once the cooldown has passed, or with no completed attempt
 * yet — i.e. whenever a new attempt is currently allowed to start. */
export function getRetakeState(attemptsForTemplate: AttemptRow[]): {
  aced: boolean;
  retakeAvailableAt: string | null;
} {
  const completed = attemptsForTemplate.filter((a) => a.percentage !== null);
  const best = completed.reduce<AttemptRow | null>(
    (acc, a) => (acc === null || (a.percentage ?? 0) > (acc.percentage ?? 0) ? a : acc),
    null
  );
  const mostRecentCompleted = completed.reduce<AttemptRow | null>(
    (acc, a) => (acc === null || (a.submitted_at ?? "") > (acc.submitted_at ?? "") ? a : acc),
    null
  );
  const aced = best?.percentage === 100;
  if (aced || !mostRecentCompleted?.submitted_at) return { aced, retakeAvailableAt: null };

  const availableAt = new Date(
    new Date(mostRecentCompleted.submitted_at).getTime() + RETAKE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  );
  return {
    aced,
    retakeAvailableAt: availableAt.getTime() > Date.now() ? availableAt.toISOString() : null,
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
    const { aced, retakeAvailableAt } = getRetakeState(list);

    if (inProgress) {
      summaries.set(templateId, {
        templateId,
        status: "in_progress",
        bestPercentage: best?.percentage ?? null,
        latestAttemptId: inProgress.id,
        completedAt: best?.submitted_at ?? null,
        aced,
        retakeAvailableAt,
        locked: false,
      });
    } else if (best) {
      summaries.set(templateId, {
        templateId,
        status: best.status,
        bestPercentage: best.percentage,
        latestAttemptId: best.id,
        completedAt: best.submitted_at,
        aced,
        retakeAvailableAt,
        locked: false,
      });
    } else {
      const mostRecent = list[0];
      summaries.set(templateId, {
        templateId,
        status: mostRecent.status,
        bestPercentage: null,
        latestAttemptId: mostRecent.id,
        completedAt: null,
        aced: false,
        retakeAvailableAt: null,
        locked: false,
      });
    }
  }

  return summaries;
}

/** Marks a leveled test locked until the same stack's previous level has
 * been passed (>= VERIFIED_SKILL_THRESHOLD) — level 1 and standalone
 * (non-leveled, levelOrder === null) templates are never locked, and
 * passing unlocks the next level immediately, with no extra wait beyond
 * the retake cooldown that already applies to the passed test itself.
 * Returns one entry per template, including ones the candidate has no
 * attempt on yet (as "not_started"), so the Skills page can render every
 * active template's lock/aced/cooldown state in one pass. */
export function applyLevelLocks(
  summaries: Map<string, SkillTestAttemptSummary>,
  templates: { id: string; stack: string; levelOrder: number | null }[]
): Map<string, SkillTestAttemptSummary> {
  const byStackLevel = new Map<string, string>();
  for (const t of templates) {
    if (t.levelOrder !== null) byStackLevel.set(`${t.stack}:${t.levelOrder}`, t.id);
  }

  const result = new Map<string, SkillTestAttemptSummary>();
  for (const t of templates) {
    const existing: SkillTestAttemptSummary = summaries.get(t.id) ?? {
      templateId: t.id,
      status: "not_started",
      bestPercentage: null,
      latestAttemptId: null,
      completedAt: null,
      aced: false,
      retakeAvailableAt: null,
      locked: false,
    };

    let locked = false;
    if (t.levelOrder !== null && t.levelOrder > 1) {
      const prereqId = byStackLevel.get(`${t.stack}:${t.levelOrder - 1}`);
      const prereqBest = prereqId ? (summaries.get(prereqId)?.bestPercentage ?? null) : null;
      locked = prereqBest === null || prereqBest < VERIFIED_SKILL_THRESHOLD;
    }

    result.set(t.id, { ...existing, locked });
  }
  return result;
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

/** How many questions an attempt is actually served — the lesser of the
 * full bank and the authored target, once the bank has grown past it.
 * Mirrors the sampling in the /start route, so the UI never advertises a
 * question count higher than what a test-taker will actually see. */
export function servedQuestionCount(template: {
  questionCount: number;
  targetQuestionCount: number | null;
}): number {
  if (!template.targetQuestionCount || template.targetQuestionCount <= 0) {
    return template.questionCount;
  }
  return Math.min(template.targetQuestionCount, template.questionCount);
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
