"use client";

import { useState } from "react";
import type { LinkedAccount, LinkProvider } from "@/lib/linked-accounts";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

const LABELS: Record<LinkProvider, string> = {
  github: "GitHub",
  google: "Google",
  linkedin: "LinkedIn",
};

const DESCRIPTIONS: Record<LinkProvider, string> = {
  github: "Unlocks your skill fingerprint, projects, and contribution heatmap.",
  google: "An alternate way to sign in.",
  linkedin: "An alternate way to sign in.",
};

function relativeDate(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

interface Props {
  primaryProvider: LinkProvider | "local";
  initialLinked: LinkedAccount[];
  isDemo: boolean;
  testLinkAvailable: boolean;
}

export function ConnectedAccountsCard({
  primaryProvider,
  initialLinked,
  isDemo,
  testLinkAvailable,
}: Props) {
  const showToast = useToast();
  const [linked, setLinked] = useState(initialLinked);
  const [busy, setBusy] = useState<LinkProvider | null>(null);

  async function unlink(provider: LinkProvider) {
    setBusy(provider);
    try {
      const res = await fetch("/api/link/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not disconnect");
      setLinked((prev) => prev.filter((l) => l.provider !== provider));
      showToast(`${LABELS[provider]} disconnected`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not disconnect", "error");
    } finally {
      setBusy(null);
    }
  }

  async function simulateLink(provider: LinkProvider) {
    setBusy(provider);
    try {
      const res = await fetch("/api/link/test-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not simulate link");
      setLinked((prev) => [
        ...prev.filter((l) => l.provider !== provider),
        {
          provider,
          providerLogin: `test-linked-${provider}`,
          avatarUrl: "https://i.pravatar.cc/300?img=33",
          linkedAt: new Date().toISOString(),
        },
      ]);
      showToast(`${LABELS[provider]} linked (simulated)`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not simulate link", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <h3 className="text-sm font-semibold text-heading">Connected Accounts</h3>
      <p className="mt-1 text-xs text-text-muted">
        Attach GitHub, Google, or LinkedIn to this account without switching how you sign in.
      </p>

      <div className="mt-4 space-y-3">
        {(["github", "google", "linkedin"] as LinkProvider[]).map((provider) => {
          const isPrimary = provider === primaryProvider;
          const link = linked.find((l) => l.provider === provider);

          return (
            <div
              key={provider}
              className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface/40 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-heading">{LABELS[provider]}</p>
                {isPrimary ? (
                  <p className="text-xs text-accent-green">Connected — this is how you sign in</p>
                ) : link ? (
                  <p className="text-xs text-accent-green">
                    Connected as {link.providerLogin ?? "unknown"} · linked {relativeDate(link.linkedAt)}
                  </p>
                ) : (
                  <p className="text-xs text-text-muted">{DESCRIPTIONS[provider]}</p>
                )}
              </div>

              {isPrimary ? null : isDemo ? (
                <span className="shrink-0 text-xs text-text-muted">Demo account</span>
              ) : link ? (
                <button
                  onClick={() => unlink(provider)}
                  disabled={busy === provider}
                  className={buttonClass("subtle", "sm")}
                >
                  {busy === provider ? "…" : "Disconnect"}
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  {testLinkAvailable && (
                    <button
                      onClick={() => simulateLink(provider)}
                      disabled={busy === provider}
                      title="Dev-only: link without a real OAuth app"
                      className={buttonClass("ghost", "sm")}
                    >
                      Simulate
                    </button>
                  )}
                  <a href={`/api/link/start/${provider}`} className={buttonClass("primary", "sm")}>
                    Connect
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
