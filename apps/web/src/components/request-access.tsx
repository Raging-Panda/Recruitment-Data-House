import { PLAN_LABELS, type Plan } from "@/lib/plan";

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

/**
 * Paid plans are granted by an admin (Admin → Plans) until billing exists —
 * the old "Upgrade Now" buttons set the plan for free, which let anyone open
 * Recruiter Tools and browse every candidate. With NEXT_PUBLIC_CONTACT_EMAIL
 * set this is a mailto pre-filled with the plan and the account ID the admin
 * needs; without it, the ID is shown to quote. No hooks, so it renders in
 * both server and client components.
 */
export function RequestAccess({
  plan,
  accountId,
  buttonClassName,
}: {
  plan: Exclude<Plan, "free">;
  accountId: string;
  buttonClassName: string;
}) {
  const label = PLAN_LABELS[plan];
  return (
    <>
      {CONTACT_EMAIL && (
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`IPSkill ${label} access`)}&body=${encodeURIComponent(
            `Hi, I'd like ${label} access.\n\nAccount ID: ${accountId}`
          )}`}
          className={buttonClassName}
        >
          Request access
        </a>
      )}
      <p className="mt-2 text-[11px] leading-snug text-text-muted">
        {label} is invite-only while IPSkill launches
        {CONTACT_EMAIL ? "." : " — ask the IPSkill team to enable it."} Your account ID:{" "}
        <code className="select-all break-all text-text-secondary">{accountId}</code>
      </p>
    </>
  );
}
