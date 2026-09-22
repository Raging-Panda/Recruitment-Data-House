"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InterviewRequest } from "@/lib/interviews";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";
import { buildGoogleCalendarLink, buildOutlookCalendarLink } from "@/lib/calendar-links";

function formatSlot(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InterviewCard({
  interview,
  viewerId,
  otherName,
}: {
  interview: InterviewRequest;
  viewerId: string;
  otherName: string;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const isCandidate = interview.candidateId === viewerId;
  const role = isCandidate ? "Interview request" : "You proposed";

  async function book(slot: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/interviews/${interview.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not book");
      showToast("Interview booked");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not book", "error");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/interviews/${interview.id}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not cancel");
      showToast("Cancelled");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not cancel", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{role}</p>
          <h3 className="text-sm font-semibold text-heading">{interview.title}</h3>
          <p className="text-xs text-text-secondary">
            With {otherName} · {interview.durationMinutes} min
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
            interview.status === "booked"
              ? "bg-accent-green/15 text-accent-green"
              : interview.status === "cancelled"
                ? "bg-surface text-text-muted"
                : "bg-primary/15 text-primary"
          }`}
        >
          {interview.status}
        </span>
      </div>

      {interview.status === "pending" && isCandidate && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-text-secondary">Pick a time that works:</p>
          {interview.proposedSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => book(slot)}
              disabled={busy}
              className="block w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-left text-sm text-heading transition hover:border-primary disabled:opacity-60"
            >
              {formatSlot(slot)}
            </button>
          ))}
        </div>
      )}

      {interview.status === "pending" && !isCandidate && (
        <p className="mt-3 text-xs text-text-muted">Waiting for {otherName} to pick a time.</p>
      )}

      {interview.status === "booked" && interview.selectedSlot && (
        <div className="mt-3">
          <p className="text-sm text-heading">{formatSlot(interview.selectedSlot)}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <a
              href={buildGoogleCalendarLink({
                title: interview.title,
                startIso: interview.selectedSlot,
                durationMinutes: interview.durationMinutes,
                details: "Scheduled via IPSkill.",
              })}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Add to Google Calendar
            </a>
            <a
              href={buildOutlookCalendarLink({
                title: interview.title,
                startIso: interview.selectedSlot,
                durationMinutes: interview.durationMinutes,
                details: "Scheduled via IPSkill.",
              })}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Add to Outlook
            </a>
            <a href={`/api/interviews/${interview.id}/ics`} className="font-medium text-primary hover:underline">
              Download .ics
            </a>
          </div>
        </div>
      )}

      {interview.status !== "cancelled" && (
        <button onClick={cancel} disabled={busy} className={`${buttonClass("subtle", "sm")} mt-3`}>
          Cancel
        </button>
      )}
    </li>
  );
}
