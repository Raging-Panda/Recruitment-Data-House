"use client";

import { useState } from "react";
import { useToast } from "@/components/toast-provider";
import type { MessagePreference } from "@/lib/message-preference";

export function DirectMessagesCard({
  initialPreference,
  isDemo,
}: {
  initialPreference: MessagePreference;
  isDemo: boolean;
}) {
  const showToast = useToast();
  const [preference, setPreference] = useState(initialPreference);
  const [busy, setBusy] = useState(false);

  async function update(next: MessagePreference) {
    if (next === preference) return;
    setBusy(true);
    try {
      const res = await fetch("/api/profile/message-preference", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      setPreference(next);
      showToast("Saved");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <h3 className="text-sm font-semibold text-heading">Direct Messages</h3>
      <p className="mt-1 text-xs text-text-muted">
        Choose whether anyone can message you directly, or has to send a request you accept first.
      </p>

      <div className="mt-4 space-y-2">
        <button
          onClick={() => update("open")}
          disabled={isDemo || busy}
          className={`w-full rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
            preference === "open" ? "border-primary bg-primary/10" : "border-surface-border bg-surface/40"
          }`}
        >
          <p className="text-sm font-medium text-heading">Open — anyone can message me</p>
          <p className="mt-0.5 text-xs text-text-muted">Messages land straight in your inbox.</p>
        </button>

        <button
          onClick={() => update("request")}
          disabled={isDemo || busy}
          className={`w-full rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
            preference === "request" ? "border-primary bg-primary/10" : "border-surface-border bg-surface/40"
          }`}
        >
          <p className="text-sm font-medium text-heading">Requires a request</p>
          <p className="mt-0.5 text-xs text-text-muted">
            The first message from someone new needs your Accept before it becomes a conversation.
          </p>
        </button>
      </div>

      {isDemo && <p className="mt-3 text-xs text-text-muted">Not editable on the shared demo account.</p>}
    </div>
  );
}
