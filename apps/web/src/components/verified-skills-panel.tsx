"use client";

import Link from "next/link";
import type { SkillTestAttemptSummary, SkillTestTemplate } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";
import { EmptyState } from "@/components/empty-state";
import { CheckCircleIcon, ShieldCheckIcon } from "@/components/icons";
import { servedQuestionCount } from "@/lib/skill-tests";

/** A stamped-seal treatment for a permanently-aced test — visually distinct
 * from the plain status pills (a fill/border/rotation "stamp" rather than
 * another same-shaped badge), so a 100% is unmistakable at a glance. */
function AcedStamp() {
  return (
    <span className="inline-flex -rotate-6 items-center gap-1 rounded-md border-2 border-accent-green px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-accent-green">
      <CheckCircleIcon size={13} />
      Aced
    </span>
  );
}

function badgeFor(summary: SkillTestAttemptSummary | undefined) {
  if (summary?.locked) {
    return { label: "Locked", className: "bg-surface text-text-muted" };
  }
  if (!summary || summary.status === "not_started") {
    return { label: "Not started", className: "bg-surface text-text-muted" };
  }
  if (summary.status === "in_progress") {
    return { label: "In progress", className: "bg-primary/20 text-primary" };
  }
  if (summary.status === "expired" && summary.bestPercentage === null) {
    return { label: "Expired", className: "bg-accent-amber/20 text-accent-amber" };
  }
  return {
    label: `${summary.bestPercentage}%`,
    className: "bg-accent-green/20 text-accent-green",
  };
}

/** Whole days until the cooldown lifts, rounded up so "0 days left" never
 * shows for a timestamp that's technically still a few hours out. */
function daysRemaining(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/** The button's label and whether the test can actually be started right
 * now — locked, aced, and cooling-down tests all render as disabled text
 * instead of a link into the test. */
function actionFor(summary: SkillTestAttemptSummary | undefined): { label: string; disabled: boolean } {
  if (summary?.locked) return { label: "Locked", disabled: true };
  if (summary?.aced) return { label: "Aced", disabled: true };
  if (summary?.retakeAvailableAt) {
    return { label: `Retake in ${daysRemaining(summary.retakeAvailableAt)}d`, disabled: true };
  }
  if (!summary || summary.status === "not_started") return { label: "Start test", disabled: false };
  if (summary.status === "in_progress") return { label: "Resume", disabled: false };
  return { label: "Retake", disabled: false };
}

export function VerifiedSkillsPanel({
  templates,
  summaries,
}: {
  templates: SkillTestTemplate[];
  summaries: Record<string, SkillTestAttemptSummary>;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {templates.map((template) => {
        const summary = summaries[template.id];
        const badge = badgeFor(summary);
        const action = actionFor(summary);
        return (
          <div
            key={template.id}
            className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-background-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-heading">{template.title}</h3>
                {summary?.aced ? (
                  <AcedStamp />
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-secondary">{template.description}</p>
              <p className="mt-1 text-xs text-text-muted">
                {servedQuestionCount(template)} questions · {Math.round(template.timeLimitSeconds / 60)} min
                {summary?.locked && " · pass the previous level to unlock"}
              </p>
            </div>
            {action.disabled ? (
              <span
                className={`${buttonClass("subtle", "md", "whitespace-nowrap")} cursor-not-allowed opacity-60`}
              >
                {action.label}
              </span>
            ) : (
              <Link
                href={`/dashboard/skills/tests/${template.slug}`}
                className={buttonClass("primary", "md", "whitespace-nowrap")}
              >
                {action.label}
              </Link>
            )}
          </div>
        );
      })}
      {templates.length === 0 && (
        <EmptyState
          icon={ShieldCheckIcon}
          title="No skill tests available yet"
          description="We're adding more stacks — check back soon."
        />
      )}
    </div>
  );
}
