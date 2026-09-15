"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { MessageItem } from "@/lib/messaging";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

export function MessageThread({
  conversationId,
  initialMessages,
  viewerId,
  otherName,
  pendingRequest = false,
}: {
  conversationId: string;
  initialMessages: MessageItem[];
  viewerId: string;
  otherName: string;
  /** True when the viewer is the one who owes an accept/decline before
   * this becomes a real conversation. */
  pendingRequest?: boolean;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not send");
      setMessages((prev) => [...prev, json.message]);
      setBody("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send", "error");
    } finally {
      setBusy(false);
    }
  }

  async function respond(action: "accept" | "decline") {
    setBusy(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Could not respond");
      if (action === "decline") {
        showToast("Request declined");
        router.push("/dashboard/messages");
      } else {
        setAccepted(true);
        showToast("Request accepted");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const showRequestBanner = pendingRequest && !accepted;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              m.senderId === viewerId
                ? "self-end bg-primary-gradient text-white"
                : "self-start bg-surface text-heading"
            }`}
          >
            {m.body}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-text-muted">Say hello to {otherName}.</p>
        )}
      </div>

      {showRequestBanner ? (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs text-text-secondary">
            {otherName} wants to message you. Accept to reply, or decline to remove this request.
          </p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => respond("decline")} disabled={busy} className={buttonClass("subtle", "sm")}>
              Decline
            </button>
            <button onClick={() => respond("accept")} disabled={busy} className={buttonClass("primary", "sm")}>
              Accept
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="mt-4 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message…"
            maxLength={2000}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none"
          />
          <button type="submit" disabled={busy || !body.trim()} className={buttonClass("primary", "sm")}>
            Send
          </button>
        </form>
      )}
    </div>
  );
}
