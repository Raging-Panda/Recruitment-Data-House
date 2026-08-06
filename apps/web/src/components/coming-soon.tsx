import type { ComponentType } from "react";
import { EmptyState } from "@/components/empty-state";

export function ComingSoon({
  title,
  icon,
}: {
  title: string;
  icon: ComponentType<{ size?: number }>;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <EmptyState
        className="mt-6 py-14"
        icon={icon}
        title="This section isn't built yet"
        description="We're still working on it — check back in a future update."
      />
    </div>
  );
}
