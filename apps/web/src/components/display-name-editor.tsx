"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DisplayNameEditor({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setIsEditing(false);
      setDraft(name);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      setName(trimmed);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(name);
              setIsEditing(false);
            }
          }}
          className="rounded-lg border border-surface-border bg-surface px-2 py-1 text-lg font-semibold text-white focus:outline-none"
        />
        <button
          onClick={save}
          disabled={isSaving}
          className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        {error && <span className="text-xs text-accent-red">{error}</span>}
      </div>
    );
  }

  return (
    <h2 className="group flex items-center gap-2 text-lg font-semibold text-white">
      {name} <span className="text-primary">✓</span>
      <button
        onClick={() => {
          setDraft(name);
          setIsEditing(true);
        }}
        aria-label="Edit name"
        className="text-xs text-text-muted opacity-0 transition group-hover:opacity-100 hover:text-white"
      >
        ✎ Edit
      </button>
    </h2>
  );
}
