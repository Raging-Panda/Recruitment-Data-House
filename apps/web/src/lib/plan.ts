// Client-safe plan types/helpers — deliberately has no dependency on
// lib/supabase.ts (which is server-only), so client components like the
// sidebar can import Plan/PLAN_LABELS without pulling in a server-only
// module and breaking the client bundle.

export type Plan = "free" | "premium_dev" | "premium_recruiter";

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  premium_dev: "Premium Dev",
  premium_recruiter: "Premium Recruiter",
};

/**
 * Two premium tiers, not one: Premium Dev is for candidate-side perks (not
 * wired to anything gated yet), Premium Recruiter is the one that unlocks
 * the Recruiter Tools section (Directory/Shortlists/Compare). They're not
 * hierarchical — a Premium Dev plan does NOT also grant recruiter access.
 */
export function hasRecruiterAccess(plan: Plan): boolean {
  return plan === "premium_recruiter";
}

/**
 * Premium Dev's first real gated feature: Growth Olympics eligibility
 * (see app/dashboard/growth). Deliberately not "any paid plan" — a
 * premium_recruiter account is a recruiter's plan, not a developer's, so
 * it doesn't imply Growth Olympics eligibility either.
 */
export function hasPremiumDevAccess(plan: Plan): boolean {
  return plan === "premium_dev";
}
