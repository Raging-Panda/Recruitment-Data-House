"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { IPSkillLogo } from "./ipskill-logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/skills", label: "Skills" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/experience", label: "Experience" },
  { href: "/dashboard/certifications", label: "Certifications" },
  { href: "/dashboard/achievements", label: "Achievements" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(true);

  return (
    <aside className="flex w-64 flex-col justify-between border-r border-surface-border bg-background-elevated px-4 py-6">
      <div>
        <div className="flex items-center gap-2 px-2">
          <IPSkillLogo size={32} />
          <div>
            <div className="text-sm font-extrabold leading-none text-white">IPSkill</div>
            <div className="text-[9px] uppercase tracking-wider text-text-muted">
              Unique Skills. Perfect Match.
            </div>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary-gradient font-semibold text-white"
                    : "text-text-secondary hover:bg-surface hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-surface-border bg-surface p-4">
          <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
          <p className="mt-1 text-xs text-text-secondary">Unlock more features.</p>
          <button className="mt-3 w-full rounded-lg bg-primary-gradient py-2 text-xs font-semibold text-white">
            Upgrade Now
          </button>
        </div>

        <button
          onClick={() => setDarkMode((v) => !v)}
          className="flex items-center justify-between px-2 text-sm text-text-secondary"
        >
          Dark Mode
          <span
            className={`h-5 w-9 rounded-full transition ${darkMode ? "bg-primary" : "bg-surface-border"}`}
          >
            <span
              className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition ${
                darkMode ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-2 text-left text-sm text-text-secondary hover:text-white"
        >
          Log out — {userName}
        </button>
      </div>
    </aside>
  );
}
