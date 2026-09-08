export function BentoPlaceholder({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-dashed border-surface-border bg-background-elevated p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-heading">{title}</h3>
        {badge && (
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase text-text-secondary">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-6 flex flex-1 items-center justify-center text-center">
        <p className="text-sm text-text-muted">{description}</p>
      </div>
    </div>
  );
}
