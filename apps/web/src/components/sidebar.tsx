"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { IPSkillLogo } from "./ipskill-logo";
import { useTheme } from "./theme-provider";
import {
  HomeIcon,
  PersonIcon,
  CodeIcon,
  BriefcaseIcon,
  LayersIcon,
  ShieldCheckIcon,
  StarIcon,
  BarChartIcon,
  GearIcon,
  ArrowRightIcon,
  CloseIcon,
  UsersIcon,
} from "./icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/profile", label: "Profile", icon: PersonIcon },
  { href: "/dashboard/directory", label: "Directory", icon: UsersIcon },
  { href: "/dashboard/skills", label: "Skills", icon: CodeIcon },
  { href: "/dashboard/projects", label: "Projects", icon: BriefcaseIcon },
  { href: "/dashboard/experience", label: "Experience", icon: LayersIcon },
  { href: "/dashboard/certifications", label: "Certifications", icon: ShieldCheckIcon },
  { href: "/dashboard/achievements", label: "Achievements", icon: StarIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChartIcon },
  { href: "/dashboard/settings", label: "Settings", icon: GearIcon },
];

export function Sidebar({
  userName,
  isOpen,
  onClose,
}: {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col justify-between overflow-y-auto border-r border-surface-border bg-background-elevated px-4 py-6 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : ""
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <IPSkillLogo size={32} />
              <div>
                <div className="text-sm font-extrabold leading-none text-heading">IPSkill</div>
                <div className="text-[9px] uppercase tracking-wider text-text-muted">
                  Unique Skills. Perfect Match.
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="text-text-secondary hover:text-heading lg:hidden"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <nav className="mt-8 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-primary-gradient font-semibold text-white"
                      : "text-text-secondary hover:bg-surface hover:text-heading"
                  }`}
                >
                  <Icon size={17} filled={active} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-surface-border bg-surface p-4">
            <p className="text-sm font-semibold text-heading">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-text-secondary">Unlock more features.</p>
            <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary-gradient py-2 text-xs font-semibold text-white transition hover:opacity-90">
              Upgrade Now <ArrowRightIcon size={14} />
            </button>
          </div>

          <button
            onClick={toggleTheme}
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
            className="px-2 text-left text-sm text-text-secondary hover:text-heading"
          >
            Log out — {userName}
          </button>
        </div>
      </aside>
    </>
  );
}
