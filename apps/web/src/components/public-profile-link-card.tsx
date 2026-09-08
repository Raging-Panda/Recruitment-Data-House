"use client";

import { useState } from "react";
import type { PublicProfileLinkStatus } from "@/lib/public-profile-link";
import { InfoCard } from "@/components/info-card";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PublicProfileLinkCard({
  initialStatus,
  isDemo,
}: {
  initialStatus: PublicProfileLinkStatus;
  isDemo: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useToast();

  const isActive = Boolean(status.token) && !status.isRevoked && !status.isExpired;
  const fullUrl =
    status.path && typeof window !== "undefined" ? `${window.location.origin}${status.path}` : "";

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/public-link", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate link");
      setStatus(data.status);
      showToast(isActive ? "Link regenerated — the old link no longer works" : "Share link created");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate link", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRevoke() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/public-link", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to revoke link");
      setStatus((prev) => ({ ...prev, isRevoked: true }));
      showToast("Link revoked");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to revoke link", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    showToast("Link copied");
  }

  return (
    <InfoCard title="Share Your Profile">
      {isActive ? (
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={fullUrl}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 truncate rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-xs text-heading focus:outline-none"
            />
            <button onClick={handleCopy} className={buttonClass("subtle", "sm")}>
              Copy
            </button>
          </div>
          <p className="text-xs text-text-muted">
            Viewed {status.viewCount} time{status.viewCount === 1 ? "" : "s"}
            {status.expiresAt && ` · expires ${formatDate(status.expiresAt)}`}
          </p>
          <div className="flex gap-3 text-xs">
            <button
              onClick={handleGenerate}
              disabled={isLoading || isDemo}
              className="text-primary hover:underline disabled:opacity-50"
            >
              Regenerate
            </button>
            <button
              onClick={handleRevoke}
              disabled={isLoading || isDemo}
              className="text-accent-red hover:underline disabled:opacity-50"
            >
              Revoke
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-1">
          <p className="text-sm text-text-muted">
            {status.isRevoked || status.isExpired
              ? "Your previous link is no longer active."
              : "Generate a read-only link you can send directly to a client, outside the platform."}
          </p>
          <button
            onClick={handleGenerate}
            disabled={isLoading || isDemo}
            className={`${buttonClass("primary", "sm")} mt-2`}
          >
            {isLoading ? "Generating…" : "Generate Link"}
          </button>
        </div>
      )}
      {isDemo && (
        <p className="mt-2 text-[11px] text-text-muted">
          Shared demo account — link management is disabled.
        </p>
      )}
    </InfoCard>
  );
}
