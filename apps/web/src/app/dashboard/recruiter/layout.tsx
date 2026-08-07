import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { isPremiumAccount } from "@/lib/premium";
import { RecruiterPaywall } from "@/components/recruiter-paywall";
import { RecruiterNav } from "@/components/recruiter-nav";

/**
 * Single gate point for the entire Recruiter Tools section — every nested
 * page (Directory, Shortlists, Compare) inherits this check rather than
 * gating itself. Deliberately a separate section from the standard dev
 * profile pages, not just another sidebar tab: it has its own nav
 * (RecruiterNav) instead of the dashboard sidebar's page list.
 */
export default async function RecruiterLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const isPremium = await isPremiumAccount(session?.githubId);

  if (!isPremium) {
    return (
      <div className="mx-auto max-w-6xl">
        <RecruiterPaywall />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <RecruiterNav />
      {children}
    </div>
  );
}
