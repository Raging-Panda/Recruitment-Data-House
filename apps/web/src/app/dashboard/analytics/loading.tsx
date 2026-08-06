import { Skeleton } from "@/components/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-96" />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-surface-border bg-background-elevated p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-surface-border bg-background-elevated p-6 md:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mx-auto mt-6 h-64 w-64 rounded-full" />
        </div>
        <div className="rounded-2xl border border-surface-border bg-background-elevated p-6">
          <Skeleton className="h-5 w-36" />
          <div className="mt-4 flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
