"use client";

import { useEffect, useState } from "react";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";
import type { ApiKeySummary } from "@/lib/api-keys";

export function ApiKeysCard({ isDemo }: { isDemo: boolean }) {
  const showToast = useToast();
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/api-keys")
      .then((res) => res.json())
      .then((data) => setKeys(data.keys ?? []))
      .catch(() => {});
  }, []);

  async function createKey() {
    setBusy(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Enterprise API key" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setNewKey(json.key);
      setKeys((prev) => [{ id: "new", label: "Enterprise API key", createdAt: new Date().toISOString(), revoked: false }, ...prev]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)));
    } finally {
      setBusy(false);
    }
  }

  if (isDemo) return null;

  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <h3 className="text-sm font-semibold text-heading">Public API</h3>
      <p className="mt-1 text-xs text-text-muted">
        A scoped read key for GET /api/public/v1/directory — public profiles only, same data
        anyone signed out can already see on /directory.
      </p>

      {newKey && (
        <div className="mt-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <p className="text-xs text-text-secondary">Copy this now — it won&apos;t be shown again:</p>
          <code className="mt-1 block break-all text-xs text-heading">{newKey}</code>
        </div>
      )}

      <button onClick={createKey} disabled={busy} className={`${buttonClass("primary", "sm")} mt-3`}>
        Generate key
      </button>

      {keys.length > 0 && (
        <ul className="mt-3 space-y-2">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between text-xs text-text-secondary">
              <span>
                {k.label} {k.revoked && "(revoked)"}
              </span>
              {!k.revoked && k.id !== "new" && (
                <button onClick={() => revoke(k.id)} className="text-accent-red hover:underline">
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
