"use client";

import Link from "next/link";
import { BarChartIcon, CloseIcon } from "@/components/icons";

export const MAX_COMPARE_SELECTION = 4;

/**
 * Floating action bar shared by the Directory browser and Shortlist detail
 * grid — both let a recruiter select 2-4 candidates and jump into the
 * Compare view with the selection carried in the URL (?ids=a,b,c).
 */
export function CompareSelectionBar({
  selectedIds,
  onClear,
}: {
  selectedIds: string[];
  onClear: () => void;
}) {
  if (selectedIds.length < 2) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-surface-border bg-background-elevated px-4 py-2.5 shadow-lg">
      <span className="text-sm text-text-secondary">
        {selectedIds.length} of {MAX_COMPARE_SELECTION} selected
      </span>
      <Link
        href={`/dashboard/recruiter/compare?ids=${selectedIds.join(",")}`}
        className="flex items-center gap-1.5 rounded-full bg-primary-gradient px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
      >
        <BarChartIcon size={14} /> Compare
      </Link>
      <button onClick={onClear} aria-label="Clear selection" className="text-text-muted hover:text-heading">
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
