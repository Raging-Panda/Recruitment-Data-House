"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { IPSkillLogo } from "./ipskill-logo";
import { useTheme } from "./theme-provider";
import { useToast } from "./toast-provider";
import { setPendingToast } from "@/lib/pending-toast";
import { PLAN_LABELS, type Plan } from "@/lib/plan";
import { V1_MODE } from "@/lib/v1-mode";
import { RequestAccess } from "./request-access";
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
  ActivityIcon,
  UsersIcon,
  BellIcon,
  SearchIcon,
  CalendarIcon,
  EyeIcon,
} from "./icons";

const ALL_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/profile", label: "Profile", icon: PersonIcon },
  { href: "/dashboard/skills", label: "Skills", icon: CodeIcon, v1: false },
  { href: "/dashboard/projects", label: "Projects", icon: BriefcaseIcon },
  { href: "/dashboard/experience", label: "Experience", icon: LayersIcon },
  { href: "/dashboard/certifications", label: "Certifications", icon: ShieldCheckIcon },
  { href: "/dashboard/achievements", label: "Achievements", icon: StarIcon, v1: false },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChartIcon },
  // The public developer index (/directory) — unauthenticated, outside
  // the /dashboard route tree entirely, so this is a genuine "leave the
  // dashboard shell" link, not an active-state-tracked internal page.
  { href: "/directory", label: "Discover", icon: SearchIcon },
  { href: "/dashboard/feed", label: "Feed", icon: ActivityIcon, v1: false },
  { href: "/dashboard/roles", label: "Open Roles", icon: BriefcaseIcon, v1: false },
  { href: "/dashboard/messages", label: "Messages", icon: BellIcon, v1: false },
  { href: "/dashboard/interviews", label: "Interviews", icon: CalendarIcon, v1: false },
  { href: "/dashboard/growth", label: "Growth Olympics", icon: UsersIcon, v1: false },
  { href: "/dashboard/settings", label: "Settings", icon: GearIcon },
];

const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => !(V1_MODE && item.v1 === false));

// Only offered to the ADMIN_GITHUB_IDS allowlist (decided server-side in the
// dashboard layout); the page itself still 404s for anyone else.
const ADMIN_NAV_ITEM = { href: "/dashboard/admin", label: "Admin", icon: EyeIcon };

export function Sidebar({
  userName,
  plan,
  showPlanToggle,
  showAdminLink,
  accountId,
  isOpen,
  onClose,
}: {
  userName: string;
  plan: Plan;
  showPlanToggle: boolean;
  showAdminLink: boolean;
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const navItems = showAdminLink ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

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
            {navItems.map((item) => {
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
          {showPlanToggle && <TestPlanToggle currentPlan={plan} />}

          <RecruiterToolsCard plan={plan} accountId={accountId} onNavigate={onClose} />

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
            onClick={() => {
              setPendingToast("Signed out");
              signOut({ callbackUrl: "/" });
            }}
            className="px-2 text-left text-sm text-text-secondary hover:text-heading"
          >
            Log out — {userName}
          </button>
        </div>
      </aside>
    </>
  );
}

/**
 * Entry point for Recruiter Tools (Directory/Shortlists/Compare) —
 * deliberately not a normal nav item, since that section is a separate,
 * premium-gated space rather than part of the standard dev profile. Without
 * the plan it shows how to request access: plans are granted by an admin
 * until billing exists (see RequestAccess).
 */
function RecruiterToolsCard({
  plan,
  accountId,
  onNavigate,
}: {
  plan: Plan;
  accountId: string;
  onNavigate: () => void;
}) {
  if (plan === "premium_recruiter") {
    return (
      <Link
        href="/dashboard/recruiter"
        onClick={onNavigate}
        className="block rounded-xl border border-primary/30 bg-surface p-4 transition hover:border-primary"
      >
        <p className="text-sm font-semibold text-heading">Recruiter Tools</p>
        <p className="mt-1 text-xs text-text-secondary">Directory, shortlists & comparisons.</p>
        <span className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-primary-gradient py-2 text-xs font-semibold text-white">
          Open Recruiter Tools <ArrowRightIcon size={14} />
        </span>
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface p-4">
      <p className="text-sm font-semibold text-heading">Recruiter Tools</p>
      <p className="mt-1 text-xs text-text-secondary">
        The Directory, shortlists, and candidate comparison — Premium Recruiter only.
      </p>
      <RequestAccess
        plan="premium_recruiter"
        accountId={accountId}
        buttonClassName="mt-3 flex w-full items-center justify-center rounded-full bg-primary-gradient py-2 text-xs font-semibold text-white transition hover:opacity-90"
      />
    </div>
  );
}

const TOGGLE_PLANS: Plan[] = ["free", "premium_dev", "premium_recruiter"];

/**
 * Dev-only QA tool — never shown outside the ALLOW_TEST_LOGIN test account
 * (gated server-side via showPlanToggle, and /api/premium/set-plan rejects
 * every other account too). Lets you cycle through all three plans to test
 * gated features without real billing, including going back down to Free,
 * which the real self-serve "Upgrade Now" flow deliberately doesn't support.
 */
function TestPlanToggle({ currentPlan }: { currentPlan: Plan }) {
  const router = useRouter();
  const showToast = useToast();
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);

  async function handleSetPlan(plan: Plan) {
    if (plan === currentPlan) return;
    setPendingPlan(plan);
    try {
      const res = await fetch("/api/premium/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to set plan");
      showToast(`Plan set to ${PLAN_LABELS[plan]}`);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to set plan", "error");
    } finally {
      setPendingPlan(null);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-surface-border bg-surface p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        Test Plan (dev only)
      </p>
      <div className="mt-2 flex flex-col gap-1">
        {TOGGLE_PLANS.map((plan) => (
          <button
            key={plan}
            onClick={() => handleSetPlan(plan)}
            disabled={pendingPlan !== null}
            className={`rounded-lg px-2 py-1.5 text-left text-xs transition disabled:opacity-50 ${
              plan === currentPlan
                ? "bg-primary-gradient font-semibold text-white"
                : "text-text-secondary hover:bg-background-elevated hover:text-heading"
            }`}
          >
            {pendingPlan === plan ? "Setting…" : PLAN_LABELS[plan]}
          </button>
        ))}
      </div>
    </div>
  );
}
