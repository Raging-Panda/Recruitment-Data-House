"use client";

import { useState } from "react";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

interface Props {
  initialHandle: string | null;
  initialVisibility: "private" | "public";
  initialCompany: string | null;
  readOnly?: boolean;
}

export function PublicIdentityCard({
  initialHandle,
  initialVisibility,
  initialCompany,
  readOnly = false,
}: Props) {
  const showToast = useToast();
  const [handle, setHandle] = useState(initialHandle ?? "");
  const [visibility, setVisibility] = useState(initialVisibility);
  const [company, setCompany] = useState(initialCompany ?? "");
  const [savedHandle, setSavedHandle] = useState(initialHandle);
  const [busy, setBusy] = useState(false);

  async function save(fields: Record<string, string>) {
    setBusy(true);
    try {
      const res = await fetch("/api/profile/handle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      if (json.identity.handle) setSavedHandle(json.identity.handle);
      showToast("Saved");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility() {
    const next = visibility === "public" ? "private" : "public";
    setVisibility(next);
    await save({ visibility: next });
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <h3 className="text-sm font-semibold text-heading">Public Profile</h3>
      <p className="mt-1 text-xs text-text-muted">
        A permanent, ownable link — put it in your GitHub bio or résumé. Different from the
        expiring share link above: this one is meant to be shared publicly and, once public, can
        appear in the developer index.
      </p>

      <div className="mt-4 flex gap-2">
        <span className="flex items-center rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-muted">
          ipskill.com/u/
        </span>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value.toLowerCase())}
          placeholder="your-handle"
          disabled={readOnly}
          className={INPUT_CLASS}
        />
        {!readOnly && (
          <button
            onClick={() => save({ handle })}
            disabled={busy || !handle.trim()}
            className={buttonClass("primary", "sm")}
          >
            Save
          </button>
        )}
      </div>
      {savedHandle && (
        <p className="mt-2 text-xs text-accent-green">Live at /u/{savedHandle}</p>
      )}

      <div className="mt-4 flex items-center justify-between rounded-lg border border-surface-border bg-surface px-3 py-2">
        <div>
          <p className="text-sm text-heading">Public visibility</p>
          <p className="text-xs text-text-muted">
            {visibility === "public"
              ? "Visible at your handle URL and listed in the public developer index."
              : "Only reachable by the private share link on Profile."}
          </p>
        </div>
        {!readOnly && (
          <button onClick={toggleVisibility} disabled={busy} className={buttonClass("subtle", "sm")}>
            {visibility === "public" ? "Make private" : "Make public"}
          </button>
        )}
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-text-secondary">Company (for team pages)</label>
        <div className="mt-1 flex gap-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Where you work"
            disabled={readOnly}
            className={INPUT_CLASS}
          />
          {!readOnly && (
            <button onClick={() => save({ company })} disabled={busy} className={buttonClass("subtle", "sm")}>
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
