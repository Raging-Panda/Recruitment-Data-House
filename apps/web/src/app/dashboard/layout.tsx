import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { getCandidateProfileOverrideSafe } from "@/lib/candidate-profile";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    redirect("/login");
  }

  const override = await getCandidateProfileOverrideSafe(session.githubId!);
  const userName = override?.displayName ?? session.user?.name ?? "Developer";

  return (
    <DashboardShell userName={userName} userImage={session.user?.image ?? undefined}>
      {children}
    </DashboardShell>
  );
}
