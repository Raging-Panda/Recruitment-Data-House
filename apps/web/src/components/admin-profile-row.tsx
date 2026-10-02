"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function AdminProfileRow(props: {
  githubId: string;
  name: string;
  login: string;
  handle: string | null;
  isPublic: boolean;
  initialVerified: boolean;
  initialHidden: boolean;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [verified, setVerified] = useState(props.initialVerified);
  const [hidden, setHidden] = useState(props.initialHidden);
  const [busy, setBusy] = useState(false);

  async function update(patch: { adminVerified?: boolean; hidden?: boolean }) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/profiles/${encodeURIComponent(props.githubId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      if (patch.adminVerified !== undefined) setVerified(patch.adminVerified);
      if (patch.hidden !== undefined) setHidden(patch.hidden);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setBusy(false);
    }
  }

  const btn = "rounded-full border border-surface-border px-3 py-1 text-xs font-medium disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-background-elevated p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-heading">
          {props.name} <span className="font-normal text-text-muted">@{props.login}</span>
        </p>
        <p className="text-xs text-text-muted">
          {props.isPublic ? "Public" : "Private"}
          {props.handle ? ` · /u/${props.handle}` : ""}
          {hidden ? " · HIDDEN" : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => update({ adminVerified: !verified })}
          className={`${btn} ${verified ? "bg-accent-green/20 text-accent-green" : "text-text-secondary"}`}
        >
          {verified ? "Reviewed ✓" : "Mark reviewed"}
        </button>
        <button
          disabled={busy}
          onClick={() => update({ hidden: !hidden })}
          className={`${btn} ${hidden ? "bg-accent-amber/20 text-accent-amber" : "text-text-secondary"}`}
        >
          {hidden ? "Unhide" : "Hide"}
        </button>
      </div>
    </div>
  );
}
