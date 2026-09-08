"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { ArrowRightIcon, UsersIcon } from "@/components/icons";

/**
 * Shown in place of the recruiter section for non-premium accounts. There's
 * no payment processor wired up yet, so "Upgrade Now" is a self-serve stub
 * (see /api/premium/upgrade) rather than a real checkout — good enough to
 * demonstrate the gate without blocking on Stripe integration.
 */
export function RecruiterPaywall() {
  const router = useRouter();
  const showToast = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  async function handleUpgrade() {
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/premium/upgrade", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to upgrade");
      showToast("Upgraded — Recruiter Tools unlocked");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to upgrade", "error");
    } finally {
      setIsUpgrading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed border-surface-border bg-background-elevated px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-gradient text-white">
        <UsersIcon size={26} />
      </div>
      <h1 className="text-xl font-bold text-heading">Recruiter Tools is Premium</h1>
      <p className="text-sm text-text-secondary">
        The Developer Directory, shortlists, saved searches, and candidate comparison are part of
        the Premium plan — separate from your dev profile.
      </p>
      <button
        onClick={handleUpgrade}
        disabled={isUpgrading}
        className="flex items-center gap-1.5 rounded-full bg-primary-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {isUpgrading ? "Upgrading…" : "Upgrade Now"} <ArrowRightIcon size={14} />
      </button>
    </div>
  );
}
