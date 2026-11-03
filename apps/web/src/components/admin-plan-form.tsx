"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { buttonClass } from "@/lib/button-styles";
import { PLAN_LABELS, type Plan } from "@/lib/plan";

const PLANS: Plan[] = ["premium_recruiter", "premium_dev", "free"];
const INPUT_CLASS =
  "rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-text-muted focus:border-primary focus:outline-none";

/** Grants (or, with Free, revokes) a plan for the account ID someone sent
 * with their access request. */
export function AdminPlanForm() {
  const router = useRouter();
  const showToast = useToast();
  const [accountId, setAccountId] = useState("");
  const [plan, setPlan] = useState<Plan>("premium_recruiter");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to set plan");
      showToast(`${accountId.trim()} is now ${PLAN_LABELS[plan]}`);
      setAccountId("");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to set plan", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        placeholder="Account ID, e.g. 12345678 or google:1099…"
        required
        aria-label="Account ID"
        className={`${INPUT_CLASS} min-w-[16rem] flex-1`}
      />
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value as Plan)}
        aria-label="Plan"
        className={INPUT_CLASS}
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {PLAN_LABELS[p]}
          </option>
        ))}
      </select>
      <button type="submit" disabled={busy} className={buttonClass("primary", "sm")}>
        {busy ? "Saving…" : "Set plan"}
      </button>
    </form>
  );
}
