import Image from "next/image";
import type { Endorsement } from "@ipskill/shared";
import { EmptyState } from "@/components/empty-state";
import { StarIcon } from "@/components/icons";

export function EndorsementList({ endorsements }: { endorsements: Endorsement[] }) {
  if (endorsements.length === 0) {
    return (
      <EmptyState
        icon={StarIcon}
        title="No endorsements yet"
        description="Endorsements from other developers on the platform show up here."
      />
    );
  }

  // Credibility-weighted ordering, not just chronological — endorsements
  // from a strong-scoring developer surface first, resisting pure
  // reciprocal-endorsement gaming a little better than a flat list.
  const sorted = [...endorsements].sort((a, b) => (b.endorserScore ?? 0) - (a.endorserScore ?? 0));
  const verifiedCount = endorsements.filter((e) => (e.endorserScore ?? 0) >= 85).length;

  return (
    <div className="flex flex-col gap-3">
      {verifiedCount > 0 && (
        <p className="text-xs text-text-muted">
          {endorsements.length} endorsements, {verifiedCount} from 85%+ scoring developers.
        </p>
      )}
      {sorted.map((e) => (
        <div key={e.id} className="flex gap-3 rounded-xl border border-surface-border bg-surface p-3">
          {e.endorserAvatarUrl ? (
            <Image
              src={e.endorserAvatarUrl}
              alt={e.endorserName}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 shrink-0 rounded-full bg-primary-gradient" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-heading">
              <span className="font-semibold">{e.endorserName}</span>
              {typeof e.endorserScore === "number" && e.endorserScore >= 85 && (
                <span className="ml-1.5 rounded-full bg-accent-green/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-green">
                  {e.endorserScore}% dev
                </span>
              )}{" "}
              endorsed <span className="font-semibold text-primary">{e.skillCategory}</span>
            </p>
            {e.comment && (
              <p className="mt-1 text-xs text-text-secondary">&ldquo;{e.comment}&rdquo;</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
