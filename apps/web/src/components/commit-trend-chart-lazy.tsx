"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/skeleton";

/** See skill-radar-chart-lazy.tsx for why this wrapper (rather than a bare
 * next/dynamic call in the Server Component page) is what actually excludes
 * recharts from the page's initial JS payload. */
export const CommitTrendChartLazy = dynamic(
  () => import("@/components/commit-trend-chart").then((m) => m.CommitTrendChart),
  {
    ssr: false,
    loading: () => <Skeleton className="mt-4 h-48 w-full" />,
  }
);
