"use client";

import { useState } from "react";
import type { DeveloperProject } from "@ipskill/shared";
import { StarIcon, EyeIcon, BriefcaseIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { buttonClass } from "@/lib/button-styles";

// "Virtualize long lists" — windowed/progressive rendering rather than a
// true virtual-scroll (no new dependency, same call the Directory grids
// already made). The hub-data fetch caps a candidate's own repos at 25
// server-side, so this rarely engages today, but keeps the page
// consistent with the rest of the app if that cap ever changes.
const PAGE_SIZE = 15;

export function ProjectsList({ projects }: { projects: DeveloperProject[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = projects.slice(0, visible);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={BriefcaseIcon}
        title="No projects yet"
        description="Push a commit to a public GitHub repo and it'll show up here automatically."
      />
    );
  }

  return (
    <>
      {shown.map((project) => (
        <a
          key={project.id}
          href={project.url}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col gap-3 rounded-xl border border-surface-border bg-background-elevated p-4 transition hover:border-primary sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-heading">{project.name}</h3>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase text-text-secondary">
                {project.category}
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              {project.languages.join(", ") || "No language data"}
            </p>
            {project.description && (
              <p className="mt-1 text-xs text-text-muted">{project.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <StarIcon size={14} /> {project.stars}
            </span>
            <span className="flex items-center gap-1">
              <EyeIcon size={14} /> {project.watchers}
            </span>
            <span className="text-xs text-text-muted">{new Date(project.updatedAt).getFullYear()}</span>
          </div>
        </a>
      ))}

      {visible < projects.length && (
        <div className="flex justify-center pt-2">
          <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className={buttonClass("subtle", "sm")}>
            Load more ({projects.length - visible} remaining)
          </button>
        </div>
      )}
    </>
  );
}
