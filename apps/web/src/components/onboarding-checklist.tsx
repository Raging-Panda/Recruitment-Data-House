import Link from "next/link";
import type { OnboardingItem } from "@/lib/onboarding";
import { CheckCircleIcon, CircleIcon } from "@/components/icons";

export function OnboardingChecklist({
  items,
  percentage,
}: {
  items: OnboardingItem[];
  percentage: number;
}) {
  const remaining = items.filter((item) => !item.done);

  if (remaining.length === 0) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-surface-border bg-background-elevated p-5">
        <CheckCircleIcon size={22} className="shrink-0 text-accent-green" />
        <div>
          <p className="text-sm font-semibold text-heading">Profile 100% complete</p>
          <p className="text-xs text-text-secondary">
            You&apos;ve finished every onboarding step — recruiters see the full picture.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-heading">Complete your profile</h2>
        <span className="text-sm font-semibold text-primary">{percentage}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface">
        <div
          className="h-2 rounded-full bg-primary-gradient transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id}>
            {item.done ? (
              <div className="flex items-center gap-2 py-1.5 text-sm text-text-secondary">
                <CheckCircleIcon size={18} className="shrink-0 text-accent-green" />
                <span className="line-through decoration-text-muted/60">{item.label}</span>
              </div>
            ) : (
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                className="group flex items-center gap-2 py-1.5 text-sm text-heading transition hover:text-primary"
              >
                <CircleIcon size={18} className="shrink-0 text-text-muted" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-primary opacity-0 transition group-hover:opacity-100">
                  {item.external ? "Open on GitHub →" : "Go →"}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
