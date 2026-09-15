"use client";

import { useState } from "react";

export function KudosButton({
  eventId,
  initialCount,
  initialGiven,
}: {
  eventId: string;
  initialCount: number;
  initialGiven: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [given, setGiven] = useState(initialGiven);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !given;
    setGiven(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await fetch("/api/social/kudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, remove: !next }),
      });
    } catch {
      setGiven(!next);
      setCount((c) => c - (next ? 1 : -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
        given ? "bg-primary/15 text-primary" : "bg-surface text-text-secondary hover:text-heading"
      }`}
    >
      👏 {count > 0 ? count : ""}
    </button>
  );
}
