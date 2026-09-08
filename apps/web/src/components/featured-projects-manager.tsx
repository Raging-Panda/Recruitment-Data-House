"use client";

import { useMemo, useState } from "react";
import type { FeaturedProject } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";
import { EmptyState } from "@/components/empty-state";
import { StarIcon } from "@/components/icons";
import { useToast } from "@/components/toast-provider";

const MAX_BLURB = 400;

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

export interface AvailableRepo {
  name: string;
  url: string;
  languages: string[];
}

interface Props {
  initialEntries: FeaturedProject[];
  availableRepos: AvailableRepo[];
  maxEntries: number;
  readOnly?: boolean;
}

export function FeaturedProjectsManager({
  initialEntries,
  availableRepos,
  maxEntries,
  readOnly = false,
}: Props) {
  const showToast = useToast();
  const [entries, setEntries] = useState(
    [...initialEntries].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [repoName, setRepoName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [busy, setBusy] = useState(false);

  const featuredNames = useMemo(
    () => new Set(entries.map((e) => e.repoName)),
    [entries]
  );
  const selectableRepos = availableRepos.filter((r) => !featuredNames.has(r.name));
  const atLimit = entries.length >= maxEntries;

  function resetForm() {
    setAdding(false);
    setEditingId(null);
    setRepoName("");
    setBlurb("");
  }

  async function add() {
    const repo = availableRepos.find((r) => r.name === repoName);
    if (!repo || !blurb.trim()) {
      showToast("Pick a repo and write a blurb", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/featured-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repo.name,
          repoUrl: repo.url,
          languages: repo.languages,
          blurb: blurb.trim(),
          sortOrder: entries.length,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not add");
      setEntries((prev) => [...prev, json.entry]);
      resetForm();
      showToast("Project featured");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add", "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    if (!blurb.trim()) {
      showToast("Blurb can't be empty", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/featured-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blurb: blurb.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      setEntries((prev) => prev.map((e) => (e.id === id ? json.entry : e)));
      resetForm();
      showToast("Blurb updated");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/featured-projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Could not remove");
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("Removed from featured");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove", "error");
    } finally {
      setBusy(false);
    }
  }

  async function reorder(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= entries.length) return;
    const next = [...entries];
    [next[index], next[target]] = [next[target], next[index]];
    setEntries(next);
    setBusy(true);
    try {
      await Promise.all(
        next.map((e, i) =>
          e.sortOrder === i
            ? null
            : fetch(`/api/featured-projects/${e.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sortOrder: i }),
              })
        )
      );
      setEntries(next.map((e, i) => ({ ...e, sortOrder: i })));
    } catch {
      showToast("Could not reorder", "error");
      setEntries(entries);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-heading">Featured Work</h2>
          <p className="mt-1 text-xs text-text-muted">
            A few projects you want seen first, each with a line on your role and why it mattered —
            not the auto-ranked list below.
          </p>
        </div>
        {!readOnly && !adding && !editingId && (
          <button
            onClick={() => setAdding(true)}
            className={buttonClass("primary", "sm")}
            disabled={atLimit || selectableRepos.length === 0}
            title={
              atLimit
                ? `You can feature at most ${maxEntries}`
                : selectableRepos.length === 0
                  ? "Every repo is already featured"
                  : undefined
            }
          >
            Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-4 rounded-2xl border border-surface-border bg-background-elevated p-5">
          <label className="text-xs font-medium text-text-secondary">Repository</label>
          <select
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className={`${INPUT_CLASS} mt-1`}
          >
            <option value="">Choose a repo…</option>
            {selectableRepos.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-xs font-medium text-text-secondary">Blurb</label>
          <textarea
            value={blurb}
            onChange={(e) => setBlurb(e.target.value.slice(0, MAX_BLURB))}
            rows={4}
            maxLength={MAX_BLURB}
            placeholder="Your role, why it matters, the hard part."
            className={`${INPUT_CLASS} mt-1`}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {blurb.length}/{MAX_BLURB}
            </span>
            <div className="flex gap-2">
              <button onClick={resetForm} className={buttonClass("subtle", "sm")} disabled={busy}>
                Cancel
              </button>
              <button onClick={add} className={buttonClass("primary", "sm")} disabled={busy}>
                {busy ? "Saving…" : "Feature it"}
              </button>
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 && !adding ? (
        <EmptyState
          className="mt-4"
          icon={StarIcon}
          title="No featured work yet"
          description={
            readOnly
              ? "This developer hasn't pinned any projects."
              : "Pin 2–6 projects and write what you actually did on each."
          }
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((entry, i) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-surface-border bg-background-elevated p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StarIcon size={14} />
                    {entry.repoUrl ? (
                      <a
                        href={entry.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-semibold text-heading hover:underline"
                      >
                        {entry.repoName}
                      </a>
                    ) : (
                      <span className="truncate text-sm font-semibold text-heading">
                        {entry.repoName}
                      </span>
                    )}
                  </div>
                  {entry.languages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entry.languages.map((l) => (
                        <span
                          key={l}
                          className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-text-secondary"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {!readOnly && editingId !== entry.id && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => reorder(i, -1)}
                      disabled={busy || i === 0}
                      className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:text-heading disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => reorder(i, 1)}
                      disabled={busy || i === entries.length - 1}
                      className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:text-heading disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(entry.id);
                        setBlurb(entry.blurb);
                      }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(entry.id)}
                      disabled={busy}
                      className="text-xs font-medium text-accent-red hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {editingId === entry.id ? (
                <div className="mt-3">
                  <textarea
                    value={blurb}
                    onChange={(e) => setBlurb(e.target.value.slice(0, MAX_BLURB))}
                    rows={4}
                    maxLength={MAX_BLURB}
                    className={INPUT_CLASS}
                    autoFocus
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {blurb.length}/{MAX_BLURB}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={resetForm}
                        className={buttonClass("subtle", "sm")}
                        disabled={busy}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(entry.id)}
                        className={buttonClass("primary", "sm")}
                        disabled={busy}
                      >
                        {busy ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                  {entry.blurb}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
