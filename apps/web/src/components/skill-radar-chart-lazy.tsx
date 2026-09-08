"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/skeleton";

/**
 * `next/dynamic`'s `ssr: false` is only allowed inside a Client Component —
 * a Server Component page can still render this wrapper directly (Server
 * Components may render Client Components), so this is how
 * recharts-backed SkillRadarChart gets excluded from a Server Component
 * page's initial JS payload instead of just being a separately-named chunk
 * that's still fetched synchronously on first load.
 */
export const SkillRadarChartLazy = dynamic(
  () => import("@/components/skill-radar-chart").then((m) => m.SkillRadarChart),
  {
    ssr: false,
    loading: () => <Skeleton className="mx-auto mt-6 h-64 w-64 rounded-full" />,
  }
);
