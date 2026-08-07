"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Plan } from "@/lib/plan";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useToast } from "./toast-provider";
import { consumePendingToast } from "@/lib/pending-toast";

export function DashboardShell({
  userName,
  userImage,
  plan,
  showPlanToggle,
  children,
}: {
  userName: string;
  userImage?: string;
  plan: Plan;
  showPlanToggle: boolean;
  children: ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const showToast = useToast();

  // Route changes close the drawer — covers nav-link clicks as well as
  // back/forward navigation, which a click handler on each link wouldn't.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Runs once, on the shell's first mount after landing in the dashboard —
  // catches the toast LoginCard set right before the sign-in redirect here.
  useEffect(() => {
    const pending = consumePendingToast();
    if (pending) showToast(pending.message, pending.variant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userName={userName}
        plan={plan}
        showPlanToggle={showPlanToggle}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={userName} userImage={userImage} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
