"use client";

import { useState, type FormEvent } from "react";
import type { MessageItem } from "@/lib/messaging";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

export function MessageThread({
  conversationId,
  initialMessages,
  viewerId,
  otherName,
}: {
  conversationId: string;
  initialMessages: MessageItem[];
  viewerId: string;
  otherName: string;
}) {
  const showToast = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

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
    </div>
  );
}
