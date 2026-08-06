import { Skeleton } from "@/components/skeleton";

export default function SkillsLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-7 w-24" />

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-surface-border bg-background-elevated p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-4 w-24" />
          <Skeleton className="mx-auto mt-6 h-64 w-64 rounded-full" />
        </div>
        <div className="rounded-2xl border border-surface-border bg-background-elevated p-6">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 flex flex-col gap-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-1.5 h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
