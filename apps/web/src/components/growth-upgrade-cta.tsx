"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";
import { StarIcon } from "@/components/icons";

/**
 * Premium Dev's first real gated feature — see lib/plan.ts's
 * hasPremiumDevAccess(). Same self-serve-stub posture as
 * RecruiterPaywall: no payment processor connected, /api/premium/upgrade
 * just sets the plan directly.
 */
export function GrowthUpgradeCta() {
  const router = useRouter();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);

  async function upgrade() {
    setBusy(true);
    try {
      const res = await fetch("/api/premium/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "premium_dev" }),
      });
      if (!res.ok) throw new Error("Failed to upgrade");
      showToast("Upgraded to Premium Dev");
      router.refresh();
    } catch {
      showToast("Failed to upgrade", "error");
    } finally {
      setBusy(false);
    }
  }

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
      <button onClick={upgrade} disabled={busy} className={buttonClass("primary", "md")}>
        {busy ? "Upgrading…" : "Upgrade to Premium Dev"}
      </button>
    </div>
  );
}
