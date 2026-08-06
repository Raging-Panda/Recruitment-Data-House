import { Skeleton } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-surface-border bg-background-elevated p-6 md:grid-cols-[auto_1fr_auto]">
        <Skeleton className="h-[88px] w-[88px] rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-surface-border bg-background-elevated p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
