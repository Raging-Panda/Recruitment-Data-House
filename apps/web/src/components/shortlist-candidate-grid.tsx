"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DirectoryEntry } from "@ipskill/shared";
import { EmptyState } from "@/components/empty-state";
import { BookmarkIcon, CheckCircleIcon, CircleIcon } from "@/components/icons";
import { useToast } from "@/components/toast-provider";
import { CompareSelectionBar, MAX_COMPARE_SELECTION } from "@/components/compare-selection-bar";

export function ShortlistCandidateGrid({
  shortlistId,
  initialCandidates,
}: {
  shortlistId: string;
  initialCandidates: DirectoryEntry[];
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const showToast = useToast();

  function toggleSelected(githubId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(githubId)) return prev.filter((id) => id !== githubId);
      if (prev.length >= MAX_COMPARE_SELECTION) {
        showToast(`You can compare up to ${MAX_COMPARE_SELECTION} at a time`, "error");
        return prev;
      }
      return [...prev, githubId];
    });
  }

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
          <Link href={`/dashboard/recruiter/directory/${entry.githubId}`} className="flex flex-col gap-3">
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

          <button
            type="button"
            title="Select to compare"
            onClick={() => toggleSelected(entry.githubId)}
            className={`absolute left-3 top-3 rounded-full border bg-background-elevated/90 p-1.5 backdrop-blur transition ${
              selectedIds.includes(entry.githubId)
                ? "border-primary text-primary"
                : "border-surface-border text-text-secondary hover:text-primary"
            }`}
          >
            {selectedIds.includes(entry.githubId) ? (
              <CheckCircleIcon size={15} />
            ) : (
              <CircleIcon size={15} />
            )}
          </button>
        </div>
      ))}

      <CompareSelectionBar selectedIds={selectedIds} onClear={() => setSelectedIds([])} />
    </div>
  );
}
