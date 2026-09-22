"use client";

import { useState } from "react";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";
import { MAX_PROPOSED_SLOTS } from "@/lib/interview-constants";

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

export function ProposeInterviewForm({
  candidateGithubId,
  candidateName,
}: {
  candidateGithubId: string;
  candidateName: string;
}) {
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Screening call");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [slots, setSlots] = useState<string[]>([""]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  function updateSlot(index: number, value: string) {
    setSlots((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addSlot() {
    if (slots.length >= MAX_PROPOSED_SLOTS) return;
    setSlots((prev) => [...prev, ""]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    const proposedSlots = slots
      .filter((s) => s.trim())
      .map((s) => new Date(s).toISOString());
    if (proposedSlots.length === 0) {
      showToast("Add at least one proposed time", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateGithubId, title, durationMinutes, proposedSlots }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not send request");
      setSent(true);
      showToast(`Interview times sent to ${candidateName}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send request", "error");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <p className="text-sm text-text-secondary">Interview times sent — {candidateName} will pick one.</p>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={buttonClass("subtle", "sm")}>
        Propose interview times
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <h3 className="text-sm font-semibold text-heading">Propose interview times</h3>
      <p className="mt-1 text-xs text-text-muted">
        {candidateName} will pick whichever works for them. No calendar connection needed — once
        booked, you both get a one-click "add to calendar" link.
      </p>

      <label className="mt-3 block text-xs font-medium text-text-secondary">Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${INPUT_CLASS} mt-1`} />

      <label className="mt-3 block text-xs font-medium text-text-secondary">Duration (minutes)</label>
      <select
        value={durationMinutes}
        onChange={(e) => setDurationMinutes(Number(e.target.value))}
        className={`${INPUT_CLASS} mt-1`}
      >
        {[15, 30, 45, 60, 90].map((m) => (
          <option key={m} value={m}>
            {m} minutes
          </option>
        ))}
      </select>

      <label className="mt-3 block text-xs font-medium text-text-secondary">Proposed times</label>
      <div className="mt-1 space-y-2">
        {slots.map((slot, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="datetime-local"
              value={slot}
              onChange={(e) => updateSlot(i, e.target.value)}
              className={INPUT_CLASS}
            />
            {slots.length > 1 && (
              <button
                onClick={() => removeSlot(i)}
                className="shrink-0 text-xs text-accent-red hover:underline"
                aria-label="Remove time"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      {slots.length < MAX_PROPOSED_SLOTS && (
        <button onClick={addSlot} className="mt-2 text-xs font-medium text-primary hover:underline">
          + Add another time
        </button>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className={buttonClass("subtle", "sm")} disabled={busy}>
          Cancel
        </button>
        <button onClick={submit} className={buttonClass("primary", "sm")} disabled={busy}>
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
