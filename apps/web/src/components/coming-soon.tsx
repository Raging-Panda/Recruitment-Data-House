export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-surface-border bg-background-elevated p-10 text-center">
        <p className="text-sm text-text-secondary">This section isn&apos;t built yet.</p>
      </div>
    </div>
  );
}
