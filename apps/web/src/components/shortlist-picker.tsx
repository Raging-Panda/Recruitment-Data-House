"use client";

import { useEffect, useRef, useState } from "react";
import type { Shortlist } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

interface ShortlistPickerProps {
  candidateGithubId: string;
  shortlists: Shortlist[];
  onShortlistsChange: (shortlists: Shortlist[]) => void;
  onClose: () => void;
}

/**
 * Small inline popover for adding one candidate to an existing shortlist,
 * or creating a new one on the spot — the shortlists list it operates on is
 * lifted to the parent (DirectoryBrowser) so it's fetched once per session
 * rather than once per card.
 */
export function ShortlistPicker({
  candidateGithubId,
  shortlists,
  onShortlistsChange,
  onClose,
}: ShortlistPickerProps) {
  const [newName, setNewName] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const showToast = useToast();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  async function addTo(shortlistId: string) {
    setIsBusy(true);
    try {
      const res = await fetch(`/api/shortlists/${shortlistId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateGithubId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add to shortlist");
      if (data.added) {
        onShortlistsChange(
          shortlists.map((list) =>
            list.id === shortlistId ? { ...list, candidateCount: list.candidateCount + 1 } : list
          )
        );
      }
      showToast(data.added ? "Added to shortlist" : "Already in that shortlist");
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add to shortlist", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function createAndAdd() {
    if (!newName.trim()) return;
    setIsBusy(true);
    try {
      const res = await fetch("/api/shortlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create shortlist");
      onShortlistsChange([data.shortlist, ...shortlists]);
      await addTo(data.shortlist.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create shortlist", "error");
      setIsBusy(false);
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-full z-10 mt-1 w-56 rounded-xl border border-surface-border bg-background-elevated p-2 shadow-lg"
    >
      {shortlists.length > 0 && (
        <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
          {shortlists.map((list) => (
            <button
              key={list.id}
              type="button"
              disabled={isBusy}
              onClick={() => addTo(list.id)}
              className="rounded-lg px-2 py-1.5 text-left text-sm text-text-secondary hover:bg-surface hover:text-heading disabled:opacity-50"
            >
              {list.name}
              <span className="ml-1 text-xs text-text-muted">({list.candidateCount})</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-1.5 border-t border-surface-border pt-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="New shortlist name"
          className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-xs text-heading placeholder:text-text-muted focus:outline-none"
        />
        <button
          type="button"
          disabled={isBusy || !newName.trim()}
          onClick={createAndAdd}
          className={buttonClass("primary", "sm")}
        >
          Add
        </button>
      </div>
    </div>
  );
}
