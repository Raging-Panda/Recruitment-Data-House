export function StatTile({
  label,
  value,
  sublabel,
  sublabelClassName = "text-text-muted",
}: {
  label: string;
  value: string;
  sublabel?: string;
  sublabelClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-bold text-heading">{value}</p>
      {sublabel && <p className={`mt-1 text-xs ${sublabelClassName}`}>{sublabel}</p>}
    </div>
  );
}
