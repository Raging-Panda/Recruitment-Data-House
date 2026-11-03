"use client";

import { useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/toast-provider";
import { setPendingToast } from "@/lib/pending-toast";
import { buttonClass } from "@/lib/button-styles";

// Must match the check in /api/account.
const CONFIRMATION = "DELETE";

export function DeleteAccountCard({ isDemo }: { isDemo: boolean }) {
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not delete your account");
      setPendingToast("Your account has been deleted");
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete your account", "error");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-accent-red/40 bg-background-elevated p-5">
      <h3 className="text-sm font-semibold text-heading">Delete account</h3>
      <p className="mt-1 text-xs text-text-muted">
        Permanently deletes your profile and everything you&apos;ve added: experience, certifications, projects,
        skill test results, shortlists, endorsements, follows and your conversations (for both people in them). It
        can&apos;t be undone. Signing in again later starts a new, empty account.
      </p>

      {isDemo ? (
        <p className="mt-3 text-xs text-text-muted">Not available on the shared demo account.</p>
      ) : !open ? (
        <button type="button" onClick={() => setOpen(true)} className={buttonClass("danger", "md", "mt-4")}>
          Delete my account
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-xs text-text-secondary">
            Type <strong className="text-heading">{CONFIRMATION}</strong> to confirm
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              autoComplete="off"
              className="mt-1.5 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-accent-red focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              disabled={busy}
              className={buttonClass("ghost", "md")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || typed.trim() !== CONFIRMATION}
              className={buttonClass("danger", "md")}
            >
              {busy ? "Deleting…" : "Delete my account permanently"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
