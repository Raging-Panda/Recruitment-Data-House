import type { VerificationBadge } from "@/lib/verification";
import { CheckCircleIcon, ShieldCheckIcon } from "@/components/icons";

export function VerificationBadges({ badges }: { badges: VerificationBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {badges.map((b) => {
        const Icon = b.id === "reviewed" ? ShieldCheckIcon : CheckCircleIcon;
        return (
          <li
            key={b.id}
            title={b.description}
            className="inline-flex items-center gap-1 rounded-full border border-accent-green/40 bg-accent-green/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent-green"
          >
            <Icon size={13} />
            {b.label}
          </li>
        );
      })}
    </ul>
  );
}
