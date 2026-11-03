import { UsersIcon } from "@/components/icons";
import { RequestAccess } from "@/components/request-access";

/**
 * Shown in place of the recruiter section for accounts without the
 * premium_recruiter plan. There's no payment processor yet, so the plan is
 * granted by an admin on request (see RequestAccess) — the old self-serve
 * "Upgrade Now" stub let anyone in for free.
 */
export function RecruiterPaywall({ accountId }: { accountId: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed border-surface-border bg-background-elevated px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-gradient text-white">
        <UsersIcon size={26} />
      </div>
      <h1 className="text-xl font-bold text-heading">Recruiter Tools is Premium</h1>
      <p className="text-sm text-text-secondary">
        The Developer Directory, shortlists, saved searches, and candidate comparison are part of
        the Premium Recruiter plan — separate from your dev profile.
      </p>
      <div className="flex flex-col items-center">
        <RequestAccess
          plan="premium_recruiter"
          accountId={accountId}
          buttonClassName="rounded-full bg-primary-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        />
      </div>
    </div>
  );
}
