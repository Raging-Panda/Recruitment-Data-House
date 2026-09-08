import { Skeleton } from "@/components/skeleton";

export default function ExperienceLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-9 w-40 rounded-full" />
    </div>
  );
}
