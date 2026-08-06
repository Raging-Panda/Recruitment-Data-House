import type { ComponentType } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border bg-background-elevated px-6 py-10 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-text-secondary">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
