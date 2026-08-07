import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DirectoryEntry, SkillCategory } from "@ipskill/shared";

const SKILL_CATEGORIES: SkillCategory[] = [
  "Backend",
  "Frontend",
  "Database",
  "DevOps",
  "Cloud",
  "Problem Solving",
  "Communication",
  "Leadership",
];

export function CompareTable({ candidates }: { candidates: DirectoryEntry[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `160px repeat(${candidates.length}, minmax(200px, 1fr))` }}
      >
        <div />
        {candidates.map((c) => (
          <Link
            key={c.githubId}
            href={`/dashboard/recruiter/directory/${c.githubId}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-surface-border bg-background-elevated p-4 text-center transition hover:border-primary"
          >
            {c.avatarUrl ? (
              <Image src={c.avatarUrl} alt={c.displayName} width={56} height={56} className="rounded-full" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary-gradient" />
            )}
            <p className="truncate font-semibold text-heading">{c.displayName}</p>
            <p className="truncate text-xs text-text-secondary">{c.headline}</p>
          </Link>
        ))}

        <CompareRow label="Overall Score">
          {candidates.map((c) => (
            <span key={c.githubId} className="text-lg font-bold text-primary">
              {c.overallScore}%
            </span>
          ))}
        </CompareRow>

        <CompareRow label="Location">
          {candidates.map((c) => (
            <span key={c.githubId} className="text-sm text-text-secondary">
              {c.location ?? "—"}
            </span>
          ))}
        </CompareRow>

        <CompareRow label="Top Languages">
          {candidates.map((c) => (
            <div key={c.githubId} className="flex flex-wrap justify-center gap-1.5">
              {c.topLanguages.length > 0 ? (
                c.topLanguages.map((lang) => (
                  <span key={lang} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-text-secondary">
                    {lang}
                  </span>
                ))
              ) : (
                <span className="text-sm text-text-muted">—</span>
              )}
            </div>
          ))}
        </CompareRow>

        <CompareRow label="Availability">
          {candidates.map((c) => (
            <span
              key={c.githubId}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                c.availableForOpportunities
                  ? "bg-accent-green/20 text-accent-green"
                  : "bg-surface text-text-muted"
              }`}
            >
              {c.availableForOpportunities ? "Open to opportunities" : "Not available"}
            </span>
          ))}
        </CompareRow>

        {SKILL_CATEGORIES.map((category) => (
          <CompareRow key={category} label={category}>
            {candidates.map((c) => {
              const score = c.skillFingerprint[category] ?? 0;
              return (
                <div key={c.githubId} className="w-full max-w-[180px]">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span />
                    <span>{score}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-surface">
                    <div
                      className="h-2 rounded-full bg-primary-gradient"
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CompareRow>
        ))}
      </div>
    </div>
  );
}

function CompareRow({ label, children }: { label: string; children: ReactNode[] }) {
  return (
    <>
      <div className="flex items-center text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </div>
      {children.map((child, i) => (
        <div key={i} className="flex items-center justify-center border-b border-surface-border pb-3">
          {child}
        </div>
      ))}
    </>
  );
}
