import type { ContributionDay } from "@ipskill/shared";
import { EmptyState } from "@/components/empty-state";
import { ActivityIcon } from "@/components/icons";

const LEVEL_CLASSES = ["bg-surface", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"];

function levelFor(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

/**
 * GitHub-style calendar heatmap — a consistency signal that's easier to
 * scan at a glance than the weekly commit-count line chart on Analytics.
 * `days` is expected in chronological order (oldest first); this pads the
 * front so the grid starts on a Sunday, matching GitHub's own layout
 * (weeks as columns, Sun-Sat as rows).
 */
export function ContributionHeatmap({ days }: { days: ContributionDay[] }) {
  if (days.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No contribution data yet"
        description="This fills in once there's public GitHub activity to read."
      />
    );
  }

  const leadingPad = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const cells: (ContributionDay | null)[] = [...Array(leadingPad).fill(null), ...days];

  const weeks: (ContributionDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const total = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          className="inline-grid grid-flow-col gap-[3px]"
          style={{ gridTemplateRows: "repeat(7, 10px)" }}
        >
          {weeks.map((week, wi) =>
            week.map((day, di) => (
              <div
                key={`${wi}-${di}`}
                title={day ? `${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}` : undefined}
                className={`h-[10px] w-[10px] rounded-sm ${day ? LEVEL_CLASSES[levelFor(day.count)] : "bg-transparent"}`}
              />
            ))
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span>{total.toLocaleString()} contributions in the last year</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {LEVEL_CLASSES.map((cls) => (
            <div key={cls} className={`h-[10px] w-[10px] rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
