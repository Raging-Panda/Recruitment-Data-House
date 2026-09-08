"use client";

import { useState, type FormEvent } from "react";
import type { SkillCategory } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

const SKILL_OPTIONS: SkillCategory[] = [
  "Backend",
  "Frontend",
  "Database",
  "DevOps",
  "Cloud",
  "Problem Solving",
  "Communication",
  "Leadership",
];

export function EndorsementForm({
  candidateGithubId,
  candidateName,
}: {
  candidateGithubId: string;
  candidateName: string;
}) {
  const [skillCategory, setSkillCategory] = useState<SkillCategory>("Backend");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/endorsements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endorseeGithubId: candidateGithubId,
          skillCategory,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to endorse");
      showToast(`Endorsed ${candidateName} for ${skillCategory}`);
      setComment("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to endorse", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-col gap-2 rounded-xl border border-dashed border-surface-border p-3"
    >
      <div className="flex gap-2">
        <select
          value={skillCategory}
          onChange={(e) => setSkillCategory(e.target.value as SkillCategory)}
          className="rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-sm text-heading focus:outline-none"
        >
          {SKILL_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "sm")}>
          {isSubmitting ? "Endorsing…" : "Endorse"}
        </button>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional note — what makes them strong at this?"
        rows={2}
        className="rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-xs text-heading placeholder:text-text-muted focus:outline-none"
      />
    </form>
  );
}
