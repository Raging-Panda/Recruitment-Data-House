"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DirectoryEntry } from "@ipskill/shared";
import { EmptyState } from "@/components/empty-state";
import { BookmarkIcon } from "@/components/icons";
import { useToast } from "@/components/toast-provider";

export function ShortlistCandidateGrid({
  shortlistId,
  initialCandidates,
}: {
  shortlistId: string;
  initialCandidates: DirectoryEntry[];
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const showToast = useToast();

  async function handleRemove(candidateGithubId: string) {
    const res = await fetch(
      `/api/shortlists/${shortlistId}/candidates?candidateGithubId=${encodeURIComponent(candidateGithubId)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setCandidates((prev) => prev.filter((c) => c.githubId !== candidateGithubId));
      showToast("Removed from shortlist");
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? "Failed to remove candidate", "error");
    }
  }

  if (candidates.length === 0) {
    return (
      <EmptyState
        className="mt-6"
        icon={BookmarkIcon}
        title="No candidates on this shortlist yet"
        description="Bookmark a developer from the Directory to add them here."
      />
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {candidates.map((entry) => (
        <div
          key={entry.githubId}
          className="relative flex flex-col gap-3 rounded-2xl border border-surface-border bg-background-elevated p-5"
        >
          <Link href={`/dashboard/directory/${entry.githubId}`} className="flex flex-col gap-3">
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
            <div className="flex flex-wrap gap-1.5">
              {entry.topLanguages.map((lang) => (
                <span key={lang} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-text-secondary">
                  {lang}
                </span>
              ))}
            </div>
            <span className="text-sm font-semibold text-primary">{entry.overallScore}% score</span>
          </Link>
          <button
            onClick={() => handleRemove(entry.githubId)}
            className="mt-1 self-start text-xs text-accent-red hover:underline"
          >
            Remove from shortlist
          </button>
        </div>
      ))}
    </div>
  );
}
