"use client";

import Link from "next/link";
import type { SkillTestAttemptSummary, SkillTestTemplate } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";
import { EmptyState } from "@/components/empty-state";
import { ShieldCheckIcon } from "@/components/icons";

function badgeFor(summary: SkillTestAttemptSummary | undefined) {
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

function buttonLabel(summary: SkillTestAttemptSummary | undefined) {
  if (!summary || summary.status === "not_started") return "Start test";
  if (summary.status === "in_progress") return "Resume";
  return "Retake";
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
        return (
          <div
            key={template.id}
            className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-background-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-heading">{template.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">{template.description}</p>
              <p className="mt-1 text-xs text-text-muted">
                {template.questionCount} questions · {Math.round(template.timeLimitSeconds / 60)} min
              </p>
            </div>
            <Link
              href={`/dashboard/skills/tests/${template.slug}`}
              className={buttonClass("primary", "md", "whitespace-nowrap")}
            >
              {buttonLabel(summary)}
            </Link>
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
