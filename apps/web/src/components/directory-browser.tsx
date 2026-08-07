"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DirectoryEntry, DirectoryFilters, Shortlist } from "@ipskill/shared";
import { EmptyState } from "@/components/empty-state";
import { UsersIcon, BookmarkIcon } from "@/components/icons";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";
import { DEFAULT_DIRECTORY_FILTERS, matchesDirectoryFilters } from "@/lib/directory-filters";
import { ShortlistPicker } from "@/components/shortlist-picker";

const MIN_SCORE_OPTIONS = [
  { label: "Any skill level", value: 0 },
  { label: "70%+", value: 70 },
  { label: "80%+", value: 80 },
  { label: "90%+", value: 90 },
];

export function DirectoryBrowser({
  entries,
  initialFilters = DEFAULT_DIRECTORY_FILTERS,
}: {
  entries: DirectoryEntry[];
  initialFilters?: DirectoryFilters;
}) {
  const [search, setSearch] = useState(initialFilters.search);
  const [location, setLocation] = useState(initialFilters.location);
  const [language, setLanguage] = useState(initialFilters.language);
  const [minScore, setMinScore] = useState(initialFilters.minScore);
  const [availableOnly, setAvailableOnly] = useState(initialFilters.availableOnly);
  const [openPickerFor, setOpenPickerFor] = useState<string | null>(null);
  const [shortlists, setShortlists] = useState<Shortlist[] | null>(null);
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const showToast = useToast();

  const filters = { search, location, language, minScore, availableOnly };

  const locations = useMemo(
    () => Array.from(new Set(entries.map((e) => e.location).filter((l): l is string => Boolean(l)))).sort(),
    [entries]
  );
  const languages = useMemo(
    () => Array.from(new Set(entries.flatMap((e) => e.topLanguages))).sort(),
    [entries]
  );

  const filtered = entries.filter((entry) => matchesDirectoryFilters(entry, filters));

  async function ensureShortlistsLoaded() {
    if (shortlists) return shortlists;
    try {
      const res = await fetch("/api/shortlists");
      const data = await res.json();
      const loaded: Shortlist[] = res.ok ? data.shortlists : [];
      setShortlists(loaded);
      return loaded;
    } catch {
      setShortlists([]);
      return [];
    }
  }

  async function handleSaveSearch() {
    const name = window.prompt("Name this saved search (e.g. \"Senior Go — Cape Town\"):");
    if (!name?.trim()) return;
    setIsSavingSearch(true);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), filters }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save search");
      showToast("Search saved — find it under Shortlists & Searches");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save search", "error");
    } finally {
      setIsSavingSearch(false);
    }
  }

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-surface-border bg-background-elevated p-4 md:flex-row md:flex-wrap md:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, headline, or language..."
          className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-text-muted focus:outline-none md:min-w-[220px]"
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:outline-none"
        >
          <option value="all">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:outline-none"
        >
          <option value="all">All languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:outline-none"
        >
          {MIN_SCORE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          Open to opportunities only
        </label>
        <button
          type="button"
          disabled={isSavingSearch}
          onClick={handleSaveSearch}
          className={buttonClass("ghost", "sm", "md:ml-auto")}
        >
          <BookmarkIcon size={14} />
          {isSavingSearch ? "Saving…" : "Save this search"}
        </button>
      </div>

      <p className="mt-4 text-xs text-text-muted">
        {filtered.length} of {entries.length} developers
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <div key={entry.githubId} className="relative">
            <Link
              href={`/dashboard/directory/${entry.githubId}`}
              className="flex h-full flex-col gap-3 rounded-2xl border border-surface-border bg-background-elevated p-5 transition hover:border-primary"
            >
              <div className="flex items-center gap-3">
                {entry.avatarUrl ? (
                  <Image
                    src={entry.avatarUrl}
                    alt={entry.displayName}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary-gradient" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-heading">{entry.displayName}</p>
                  <p className="truncate text-xs text-text-secondary">{entry.headline}</p>
                </div>
              </div>

              {entry.location && <p className="text-xs text-text-muted">📍 {entry.location}</p>}

              <div className="flex flex-wrap gap-1.5">
                {entry.topLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-text-secondary"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-sm font-semibold text-primary">{entry.overallScore}% score</span>
                {entry.availableForOpportunities ? (
                  <span className="rounded-full bg-accent-green/20 px-2 py-0.5 text-[11px] font-medium text-accent-green">
                    Open to opportunities
                  </span>
                ) : (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-text-muted">
                    Not available
                  </span>
                )}
              </div>
            </Link>

            <button
              type="button"
              title="Add to shortlist"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await ensureShortlistsLoaded();
                setOpenPickerFor(entry.githubId);
              }}
              className="absolute right-3 top-3 rounded-full border border-surface-border bg-background-elevated/90 p-1.5 text-text-secondary backdrop-blur transition hover:text-primary"
            >
              <BookmarkIcon size={15} />
            </button>

            {openPickerFor === entry.githubId && (
              <ShortlistPicker
                candidateGithubId={entry.githubId}
                shortlists={shortlists ?? []}
                onShortlistsChange={setShortlists}
                onClose={() => setOpenPickerFor(null)}
              />
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          className="mt-4"
          icon={UsersIcon}
          title="No developers match those filters"
          description="Try widening your search or clearing a filter."
        />
      )}
    </div>
  );
}
