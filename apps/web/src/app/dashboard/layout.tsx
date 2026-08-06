import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={session.user?.name ?? "Developer"} />
      <div className="flex flex-1 flex-col">
        <Topbar
          userName={session.user?.name ?? "Developer"}
          userImage={session.user?.image ?? undefined}
        />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
