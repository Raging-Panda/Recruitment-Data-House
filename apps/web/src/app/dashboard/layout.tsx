import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { getCandidateProfileOverrideSafe } from "@/lib/candidate-profile";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    redirect("/login");
  }

  const override = await getCandidateProfileOverrideSafe(session.githubId!);
  const userName = override?.displayName ?? session.user?.name ?? "Developer";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={userName} />
      <div className="flex flex-1 flex-col">
        <Topbar userName={userName} userImage={session.user?.image ?? undefined} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
