"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DirectoryEntry } from "@ipskill/shared";
import { EmptyState } from "@/components/empty-state";
import { UsersIcon } from "@/components/icons";

const MIN_SCORE_OPTIONS = [
  { label: "Any skill level", value: 0 },
  { label: "70%+", value: 70 },
  { label: "80%+", value: 80 },
  { label: "90%+", value: 90 },
];

export function DirectoryBrowser({ entries }: { entries: DirectoryEntry[] }) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [language, setLanguage] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [availableOnly, setAvailableOnly] = useState(false);

  const locations = useMemo(
    () => Array.from(new Set(entries.map((e) => e.location).filter((l): l is string => Boolean(l)))).sort(),
    [entries]
  );
  const languages = useMemo(
    () => Array.from(new Set(entries.flatMap((e) => e.topLanguages))).sort(),
    [entries]
  );

  const filtered = entries.filter((entry) => {
    if (availableOnly && !entry.availableForOpportunities) return false;
    if (entry.overallScore < minScore) return false;
    if (location !== "all" && entry.location !== location) return false;
    if (language !== "all" && !entry.topLanguages.includes(language)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [entry.displayName, entry.headline, entry.location, ...entry.topLanguages]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

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
      </div>

      <p className="mt-4 text-xs text-text-muted">
        {filtered.length} of {entries.length} developers
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <Link
            key={entry.githubId}
            href={`/dashboard/directory/${entry.githubId}`}
            className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-background-elevated p-5 transition hover:border-primary"
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
              <div className="min-w-0">
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
