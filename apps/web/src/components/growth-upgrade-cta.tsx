import { buttonClass } from "@/lib/button-styles";
import { StarIcon } from "@/components/icons";
import { RequestAccess } from "@/components/request-access";

/**
 * Premium Dev's gated feature — see lib/plan.ts's hasPremiumDevAccess().
 * Like RecruiterPaywall, the plan is granted by an admin on request until
 * billing exists (see RequestAccess).
 */
export function GrowthUpgradeCta({ accountId }: { accountId: string }) {
  return (
    <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed border-surface-border bg-background-elevated px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-gradient text-white">
        <StarIcon size={26} />
      </div>
      <h2 className="text-xl font-bold text-heading">Growth Olympics is Premium Dev</h2>
      <p className="text-sm text-text-secondary">
        See where you rank against other developers' month-over-month growth, and compete for the
        monthly prize.
      </p>
      <div className="flex flex-col items-center">
        <RequestAccess plan="premium_dev" accountId={accountId} buttonClassName={buttonClass("primary", "md")} />
      </div>
    </div>
  );
}
