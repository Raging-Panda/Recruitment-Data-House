"use client";

import { useState } from "react";
import type { SkillCategory } from "@ipskill/shared";
import type { SkillProof } from "@/lib/skill-proofs";
import { buttonClass } from "@/lib/button-styles";
import { EmptyState } from "@/components/empty-state";
import { TagIcon } from "@/components/icons";
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

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

export function SkillProofsManager({
  initialEntries,
  readOnly = false,
}: {
  initialEntries: SkillProof[];
  readOnly?: boolean;
}) {
  const showToast = useToast();
  const [entries, setEntries] = useState(initialEntries);
  const [adding, setAdding] = useState(false);
  const [skillCategory, setSkillCategory] = useState<SkillCategory>("Backend");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!title.trim() || !url.trim()) {
      showToast("Title and URL are required", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/skill-proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillCategory, title: title.trim(), url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not add");
      setEntries((prev) => [json.entry, ...prev]);
      setAdding(false);
      setTitle("");
      setUrl("");
      showToast("Proof link added");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/skill-proofs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("Removed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-heading">Proof of Work</h2>
          <p className="mt-1 text-xs text-text-muted">
            Back a skill claim with a concrete, clickable artifact — a merged PR, a release, a
            package, a talk — so it's not just a number on the fingerprint.
          </p>
        </div>
        {!readOnly && !adding && (
          <button onClick={() => setAdding(true)} className={buttonClass("primary", "sm")}>
            Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-4 rounded-2xl border border-surface-border bg-background-elevated p-5">
          <select
            value={skillCategory}
            onChange={(e) => setSkillCategory(e.target.value as SkillCategory)}
            className={INPUT_CLASS}
          >
            {SKILL_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What is it — e.g. 'Merged PR: rate limiter for the API gateway'"
            className={`${INPUT_CLASS} mt-2`}
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className={`${INPUT_CLASS} mt-2`}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className={buttonClass("subtle", "sm")} disabled={busy}>
              Cancel
            </button>
            <button onClick={add} className={buttonClass("primary", "sm")} disabled={busy}>
              {busy ? "Saving…" : "Add proof"}
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 && !adding ? (
        <EmptyState
          className="mt-4"
          icon={TagIcon}
          title="No proof links yet"
          description="Optional — attach a real artifact to a skill so claims aren't just self-reported."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-background-elevated px-4 py-3"
            >
              <div className="min-w-0">
                <span className="mr-2 rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-secondary">
                  {entry.skillCategory}
                </span>
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-heading hover:underline"
                >
                  {entry.title}
                </a>
              </div>
              {!readOnly && (
                <button onClick={() => remove(entry.id)} disabled={busy} className="shrink-0 text-xs text-accent-red hover:underline">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
