"use client";

import { useState } from "react";
import type { ExternalLink, ExternalLinkKind } from "@/lib/external-links";
import { buttonClass } from "@/lib/button-styles";
import { EmptyState } from "@/components/empty-state";
import { TagIcon } from "@/components/icons";
import { useToast } from "@/components/toast-provider";

const KIND_LABELS: Record<ExternalLinkKind, string> = {
  writing: "Writing",
  talk: "Talk",
  package: "Package",
  oss: "OSS",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

export function ExternalLinksManager({
  initialEntries,
  readOnly = false,
}: {
  initialEntries: ExternalLink[];
  readOnly?: boolean;
}) {
  const showToast = useToast();
  const [entries, setEntries] = useState(initialEntries);
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<ExternalLinkKind>("writing");
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
      const res = await fetch("/api/external-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title: title.trim(), url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not add");
      setEntries((prev) => [...prev, json.entry]);
      setAdding(false);
      setTitle("");
      setUrl("");
      showToast("Link added");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/external-links/${id}`, { method: "DELETE" });
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
          <h2 className="text-lg font-semibold text-heading">Beyond GitHub</h2>
          <p className="mt-1 text-xs text-text-muted">
            Blog posts, talks, published packages, notable OSS work on repos you don't own.
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
          <select value={kind} onChange={(e) => setKind(e.target.value as ExternalLinkKind)} className={INPUT_CLASS}>
            {Object.entries(KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
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
              {busy ? "Saving…" : "Add link"}
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 && !adding ? (
        <EmptyState className="mt-4" icon={TagIcon} title="Nothing added yet" description="Optional — for devs whose best work isn't all in personal repos." />
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-background-elevated px-4 py-3"
            >
              <div className="min-w-0">
                <span className="mr-2 rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-secondary">
                  {KIND_LABELS[entry.kind]}
                </span>
                <a href={entry.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-heading hover:underline">
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
