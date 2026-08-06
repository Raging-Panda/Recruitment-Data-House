export function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <h3 className="text-sm font-semibold text-heading">{title}</h3>
      <div className="mt-3 divide-y divide-surface-border/50">{children}</div>
    </div>
  );
}
