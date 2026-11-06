"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ConsentCheckbox } from "./consent-checkbox";
import { useToast } from "./toast-provider";
import { buttonClass } from "@/lib/button-styles";
import { CONSENT_VERSION } from "@/lib/legal";

/** /consent: the same tick box as the login card, for a signed-in account
 * with no consent on record for the current policy version. */
export function ConsentCard() {
  const router = useRouter();
  const showToast = useToast();
  const [consented, setConsented] = useState(false);
  const [showError, setShowError] = useState(false);
  const [busy, setBusy] = useState(false);

  function setConsent(given: boolean) {
    setConsented(given);
    if (given) setShowError(false);
  }

  async function submit() {
    if (!consented) {
      setShowError(true);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: CONSENT_VERSION }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Your consent couldn't be saved. Please try again.");
      router.replace("/dashboard/profile");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Your consent couldn't be saved. Please try again.", "error");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-6">
      <h1 className="text-xl font-bold text-heading">Before you continue</h1>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        IPSkill uses your personal information to build your developer profile and show it to the people your
        settings allow, including approved recruiters. South Africa&apos;s Protection of Personal Information Act
        (POPIA) means we need your consent to do that.
      </p>

      <div className="mt-5">
        <ConsentCheckbox checked={consented} onChange={setConsent} showError={showError} />
      </div>

      <button type="button" onClick={submit} disabled={busy} className={buttonClass("primary", "md", "mt-5 w-full")}>
        {busy ? "Saving…" : "Continue"}
      </button>

      <p className="mt-4 text-center text-xs text-text-muted">
        Don&apos;t want to consent?{" "}
        <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="underline hover:text-heading">
          Sign out
        </button>
        , or delete your account below.
      </p>
    </div>
  );
}
