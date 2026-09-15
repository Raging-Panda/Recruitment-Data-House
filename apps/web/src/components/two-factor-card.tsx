"use client";

import { useState } from "react";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

type Step = "idle" | "setup" | "backup-codes";

export function TwoFactorCard({
  initiallyEnabled,
  isDemo,
}: {
  initiallyEnabled: boolean;
  isDemo: boolean;
}) {
  const showToast = useToast();
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [step, setStep] = useState<Step>("idle");
  const [busy, setBusy] = useState(false);

  const [secret, setSecret] = useState("");
  const [displaySecret, setDisplaySecret] = useState("");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [setupCode, setSetupCode] = useState("");

  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [disableCode, setDisableCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  async function startSetup() {
    setBusy(true);
    try {
      const res = await fetch("/api/2fa/setup", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start setup");
      setSecret(json.secret);
      setDisplaySecret(json.displaySecret);
      setOtpauthUri(json.otpauthUri);
      setSetupCode("");
      setStep("setup");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not start setup", "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup() {
    setBusy(true);
    try {
      const res = await fetch("/api/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, code: setupCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not confirm");
      setBackupCodes(json.backupCodes);
      setEnabled(true);
      setStep("backup-codes");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not confirm", "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not disable");
      setEnabled(false);
      setShowDisable(false);
      setDisableCode("");
      showToast("Two-factor authentication disabled");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not disable", "error");
    } finally {
      setBusy(false);
    }
  }

  function finishBackupCodesStep() {
    setStep("idle");
    setBackupCodes([]);
    showToast("Two-factor authentication enabled");
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-heading">Two-Factor Authentication</h3>
          <p className="mt-1 text-xs text-text-muted">
            Require a code from an authenticator app in addition to your password.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
            enabled ? "bg-accent-green/15 text-accent-green" : "bg-surface text-text-secondary"
          }`}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {step === "idle" && (
        <div className="mt-4">
          {!enabled ? (
            <button onClick={startSetup} disabled={isDemo || busy} className={buttonClass("primary", "sm")}>
              Enable
            </button>
          ) : !showDisable ? (
            <button onClick={() => setShowDisable(true)} disabled={isDemo} className={buttonClass("subtle", "sm")}>
              Disable
            </button>
          ) : (
            <div className="rounded-xl border border-dashed border-surface-border p-3">
              <p className="text-xs text-text-secondary">
                Enter a current code (or a backup code) to confirm.
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="123456"
                  className={INPUT_CLASS}
                />
                <button onClick={disable} disabled={busy || !disableCode.trim()} className={buttonClass("primary", "sm")}>
                  Confirm
                </button>
              </div>
              <button
                onClick={() => {
                  setShowDisable(false);
                  setDisableCode("");
                }}
                className="mt-2 text-xs text-text-muted hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
          {isDemo && <p className="mt-2 text-xs text-text-muted">Not editable on the shared demo account.</p>}
        </div>
      )}

      {step === "setup" && (
        <div className="mt-4 rounded-xl border border-surface-border bg-surface/40 p-4">
          <p className="text-xs text-text-secondary">
            Add this to your authenticator app (Google Authenticator, 1Password, Authy, etc.) using
            manual entry:
          </p>
          <p className="mt-2 rounded-lg bg-surface px-3 py-2 font-mono text-sm text-heading">
            {displaySecret}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-text-muted">otpauth:// URI</summary>
            <p className="mt-1 break-all rounded-lg bg-surface px-3 py-2 font-mono text-[10px] text-text-secondary">
              {otpauthUri}
            </p>
          </details>
          <p className="mt-3 text-xs text-text-secondary">Then enter the 6-digit code it shows:</p>
          <div className="mt-2 flex gap-2">
            <input
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              placeholder="123456"
              className={INPUT_CLASS}
            />
            <button onClick={confirmSetup} disabled={busy || !setupCode.trim()} className={buttonClass("primary", "sm")}>
              Confirm
            </button>
          </div>
          <button
            onClick={() => setStep("idle")}
            className="mt-2 text-xs text-text-muted hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {step === "backup-codes" && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-heading">Save your backup codes</p>
          <p className="mt-1 text-xs text-text-secondary">
            Each one works once if you lose access to your authenticator app. They won&apos;t be
            shown again.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-heading">
            {backupCodes.map((code) => (
              <span key={code} className="rounded-lg bg-surface px-2 py-1 text-center">
                {code}
              </span>
            ))}
          </div>
          <button onClick={finishBackupCodesStep} className={`${buttonClass("primary", "sm")} mt-4`}>
            I&apos;ve saved these
          </button>
        </div>
      )}
    </div>
  );
}
