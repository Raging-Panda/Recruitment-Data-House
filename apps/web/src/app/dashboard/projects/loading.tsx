import { Skeleton } from "@/components/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>

      <div className="mt-10">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-4 w-80" />
        <div className="mt-4 flex flex-col gap-4 border-l border-surface-border pl-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full max-w-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
