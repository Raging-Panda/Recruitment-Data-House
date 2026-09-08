"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { SavedSearch, Shortlist } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";
import { EmptyState } from "@/components/empty-state";
import { BookmarkIcon, SearchIcon } from "@/components/icons";
import { directoryUrlForFilters, summarizeFilters } from "@/lib/directory-filters";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ShortlistsManager({
  initialShortlists,
  initialSavedSearches,
}: {
  initialShortlists: Shortlist[];
  initialSavedSearches: SavedSearch[];
}) {
  const [shortlists, setShortlists] = useState(initialShortlists);
  const [savedSearches, setSavedSearches] = useState(initialSavedSearches);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const showToast = useToast();

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/shortlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create shortlist");
      setShortlists((prev) => [data.shortlist, ...prev]);
      setNewName("");
      showToast("Shortlist created");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create shortlist", "error");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteShortlist(id: string) {
    const res = await fetch(`/api/shortlists/${id}`, { method: "DELETE" });
    if (res.ok) {
      setShortlists((prev) => prev.filter((s) => s.id !== id));
      showToast("Shortlist deleted");
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? "Failed to delete shortlist", "error");
    }
  }

  async function handleDeleteSearch(id: string) {
    const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      showToast("Saved search deleted");
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? "Failed to delete saved search", "error");
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold text-heading">Shortlists</h2>
        <p className="mt-1 text-xs text-text-muted">
          Named candidate lists — add developers from the Directory with the bookmark button on
          their card.
        </p>

        <form onSubmit={handleCreate} className="mt-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New shortlist name"
            className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-text-muted focus:outline-none md:max-w-xs"
          />
          <button type="submit" disabled={isCreating || !newName.trim()} className={buttonClass("primary", "md")}>
            {isCreating ? "Creating…" : "+ New Shortlist"}
          </button>
        </form>

        {shortlists.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={BookmarkIcon}
            title="No shortlists yet"
            description="Create one above, or bookmark a candidate from the Directory to start one."
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {shortlists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-background-elevated p-4"
              >
                <Link href={`/dashboard/recruiter/shortlists/${list.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-heading hover:underline">{list.name}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {list.candidateCount} candidate{list.candidateCount === 1 ? "" : "s"} · created{" "}
                    {formatDate(list.createdAt)}
                  </p>
                </Link>
                <button
                  onClick={() => handleDeleteShortlist(list.id)}
                  className="shrink-0 text-xs text-accent-red hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-heading">Saved Searches</h2>
        <p className="mt-1 text-xs text-text-muted">
          Save a Directory filter combination to re-run it later — and get notified when a new
          candidate matches it.
        </p>

        {savedSearches.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={SearchIcon}
            title="No saved searches yet"
            description="Filter the Directory the way you want, then click “Save this search.”"
          />
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-background-elevated p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-heading">{search.name}</p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {summarizeFilters(search.filters)} · saved {formatDate(search.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  <Link href={directoryUrlForFilters(search.filters)} className="text-primary hover:underline">
                    Run
                  </Link>
                  <button onClick={() => handleDeleteSearch(search.id)} className="text-accent-red hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
