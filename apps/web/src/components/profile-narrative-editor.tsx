"use client";

import { useState } from "react";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

const MAX_ABOUT = 1200;
const MAX_CURRENTLY = 140;

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

interface Props {
  /** Developer-written About, or null if they haven't written one. */
  initialAbout: string | null;
  /** The GitHub bio — shown as the fallback so it's clear what a blank
   * authored About falls back to. */
  githubBio: string | null;
  initialCurrently: string | null;
  initialCurrentlyUpdatedAt: string | null;
  /** Demo account can't persist — render read-only. */
  readOnly?: boolean;
}

function relativeDate(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}

export function ProfileNarrativeEditor({
  initialAbout,
  githubBio,
  initialCurrently,
  initialCurrentlyUpdatedAt,
  readOnly = false,
}: Props) {
  const showToast = useToast();

  const [about, setAbout] = useState(initialAbout);
  const [currently, setCurrently] = useState(initialCurrently);
  const [currentlyUpdatedAt, setCurrentlyUpdatedAt] = useState(initialCurrentlyUpdatedAt);

  const [editing, setEditing] = useState<null | "about" | "currently">(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(field: "about" | "currently") {
    setDraft((field === "about" ? about : currently) ?? "");
    setEditing(field);
  }

  async function save(field: "about" | "currently") {
    setSaving(true);
    const key = field === "about" ? "aboutAuthored" : "currently";
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      if (field === "about") {
        setAbout(json.override.aboutAuthored);
      } else {
        setCurrently(json.override.currently);
        setCurrentlyUpdatedAt(json.override.currentlyUpdatedAt);
      }
      setEditing(null);
      showToast(field === "about" ? "About updated" : "Status updated");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Currently */}
      <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-heading">Currently</h2>
          {!readOnly && editing !== "currently" && (
            <button
              onClick={() => startEdit("currently")}
              className="text-xs font-medium text-primary hover:underline"
            >
              {currently ? "Edit" : "Add"}
            </button>
          )}
        </div>

        {editing === "currently" ? (
          <div className="mt-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_CURRENTLY))}
              maxLength={MAX_CURRENTLY}
              placeholder="What you're working on or open to right now"
              className={TEXTAREA_CLASS}
              autoFocus
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {draft.length}/{MAX_CURRENTLY}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className={buttonClass("subtle", "sm")}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={() => save("currently")}
                  className={buttonClass("primary", "sm")}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : currently ? (
          <div className="mt-2">
            <p className="text-sm text-text-secondary">{currently}</p>
            {currentlyUpdatedAt && (
              <p className="mt-1 text-xs text-text-muted">
                Updated {relativeDate(currentlyUpdatedAt)}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-muted">
            A short line recruiters see first — what you&apos;re building or the kind of role
            you&apos;re open to.
          </p>
        )}
      </div>

      {/* About */}
      <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-heading">About</h2>
          {!readOnly && editing !== "about" && (
            <button
              onClick={() => startEdit("about")}
              className="text-xs font-medium text-primary hover:underline"
            >
              {about ? "Edit" : "Write one"}
            </button>
          )}
        </div>

        {editing === "about" ? (
          <div className="mt-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_ABOUT))}
              maxLength={MAX_ABOUT}
              rows={7}
              placeholder="Who you are as an engineer, what you care about, what you're looking for. This sits above the auto-derived stats."
              className={TEXTAREA_CLASS}
              autoFocus
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {draft.length}/{MAX_ABOUT}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className={buttonClass("subtle", "sm")}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={() => save("about")}
                  className={buttonClass("primary", "sm")}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : about ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
            {about}
          </p>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-text-muted">
              {githubBio
                ? "Using your GitHub bio for now:"
                : "No bio yet — a few sentences in your own words go a long way."}
            </p>
            {githubBio && (
              <p className="mt-2 whitespace-pre-line text-sm italic leading-relaxed text-text-secondary">
                {githubBio}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
