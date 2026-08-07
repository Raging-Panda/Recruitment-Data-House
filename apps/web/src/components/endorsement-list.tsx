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

  return (
    <div className="flex flex-col gap-3">
      {endorsements.map((e) => (
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
              <span className="font-semibold">{e.endorserName}</span> endorsed{" "}
              <span className="font-semibold text-primary">{e.skillCategory}</span>
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
