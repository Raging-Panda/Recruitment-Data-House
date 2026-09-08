import type { NextPositionSuggestions } from "@/lib/position-suggestions";

export function NextPositionCard({ suggestions }: { suggestions: NextPositionSuggestions }) {
  const { primary, alternates } = suggestions;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-surface-border bg-background-elevated p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-heading">Next Position Suggestions</h3>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase text-text-secondary">
          {primary.matchScore}% match
        </span>
      </div>

      <div className="mt-4">
        <p className="text-lg font-bold text-heading">{primary.title}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{primary.stackTag}</p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {primary.rationale.map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="mt-0.5 text-primary">•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {alternates.length > 0 && (
        <div className="mt-4 border-t border-surface-border pt-3">
          <p className="text-xs font-medium text-text-muted">Also worth considering</p>
          <div className="mt-2 flex flex-col gap-2">
            {alternates.map((alt) => (
              <div key={alt.title} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{alt.title}</span>
                <span className="text-text-muted">{alt.matchScore}% match</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
