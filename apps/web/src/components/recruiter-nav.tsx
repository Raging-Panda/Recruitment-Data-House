"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersIcon, BookmarkIcon, BarChartIcon, ArrowRightIcon } from "@/components/icons";

const TABS = [
  { href: "/dashboard/recruiter/directory", label: "Directory", icon: UsersIcon },
  { href: "/dashboard/recruiter/shortlists", label: "Shortlists", icon: BookmarkIcon },
  { href: "/dashboard/recruiter/compare", label: "Compare", icon: BarChartIcon },
];

/**
 * Distinct sub-nav for the Recruiter Tools section — deliberately not the
 * same sidebar a candidate sees on their own profile, since this is a
 * separate, premium-gated space rather than another dashboard tab.
 */
export function RecruiterNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-surface-border pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary-gradient px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          Recruiter Tools
        </span>
        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-surface font-semibold text-heading"
                    : "text-text-secondary hover:text-heading"
                }`}
              >
                <Icon size={15} filled={active} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary"
      >
        <ArrowRightIcon size={12} className="rotate-180" />
        Back to my profile
      </Link>
    </div>
  );
}
