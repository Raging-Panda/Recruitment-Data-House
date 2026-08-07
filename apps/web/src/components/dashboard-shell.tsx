"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({
  userName,
  userImage,
  children,
}: {
  userName: string;
  userImage?: string;
  children: ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Route changes close the drawer — covers nav-link clicks as well as
  // back/forward navigation, which a click handler on each link wouldn't.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={userName} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={userName} userImage={userImage} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
