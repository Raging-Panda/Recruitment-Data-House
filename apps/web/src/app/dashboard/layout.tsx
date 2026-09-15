import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { getCandidateProfileOverrideSafe } from "@/lib/candidate-profile";
import { getPlan } from "@/lib/premium";
import { isTestAccount } from "@/lib/test-mode";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  // githubId (not accessToken) is the right gate here — a Google sign-in
  // has no GitHub token but is still a real, signed-in account. See
  // lib/github-connection.ts for where the accessToken distinction matters.
  if (!session || !session.githubId) {
    redirect("/login");
  }

  const [override, plan] = await Promise.all([
    getCandidateProfileOverrideSafe(session.githubId!),
    getPlan(session.githubId),
  ]);
  const userName = override?.displayName ?? session.user?.name ?? "Developer";

  return (
    <DashboardShell
      userName={userName}
      userImage={session.user?.image ?? undefined}
      plan={plan}
      showPlanToggle={isTestAccount(session.githubId)}
    >
      {children}
    </DashboardShell>
  );
}
