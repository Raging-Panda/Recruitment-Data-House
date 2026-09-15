"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DirectoryEntry } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";

const PAGE_SIZE = 24;

/**
 * "Virtualize long lists" — a windowed/progressive render rather than a
 * true virtual-scroll (no new dependency added; mobile's FlatList already
 * virtualizes natively). Caps the DOM to PAGE_SIZE cards at a time instead
 * of mounting the whole directory at once, which is what actually costs
 * on a directory that grows past a page or two.
 */
export function PagedDirectoryGrid({ entries }: { entries: DirectoryEntry[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = entries.slice(0, visible);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((entry) => (
          <Link
            key={entry.githubId}
            href={`/u/${entry.handle}`}
            className="rounded-2xl border border-surface-border bg-background-elevated p-5 transition hover:border-primary"
          >
            <div className="flex items-center gap-3">
              {entry.avatarUrl ? (
                <Image src={entry.avatarUrl} alt={entry.displayName} width={44} height={44} className="rounded-full" />
              ) : (
                <div className="h-11 w-11 rounded-full bg-primary-gradient" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-heading">{entry.displayName}</p>
                <p className="truncate text-xs text-text-secondary">{entry.headline}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {entry.topLanguages.slice(0, 3).map((lang) => (
                <span key={lang} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-text-secondary">
                  {lang}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs font-medium text-primary">{entry.overallScore}% overall score</p>
          </Link>
        ))}
      </div>

      {visible < entries.length && (
        <div className="mt-6 flex justify-center">
          <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className={buttonClass("subtle", "sm")}>
            Load more ({entries.length - visible} remaining)
          </button>
        </div>
      )}
    </>
  );
}
