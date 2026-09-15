"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

export function MessageRequestRow({
  conversationId,
  name,
  avatarUrl,
  preview,
}: {
  conversationId: string;
  name: string;
  avatarUrl: string | null;
  preview: string | null;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState(false);

  async function respond(action: "accept" | "decline") {
    setBusy(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Could not respond");
      setResolved(true);
      showToast(action === "accept" ? "Request accepted" : "Request declined");
      if (action === "accept") router.push(`/dashboard/messages/${conversationId}`);
      else router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  if (resolved) return null;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name} width={40} height={40} className="rounded-full" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-primary-gradient" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-heading">{name}</p>
        <p className="truncate text-xs text-text-secondary">{preview ?? "wants to message you"}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button onClick={() => respond("decline")} disabled={busy} className={buttonClass("subtle", "sm")}>
          Decline
        </button>
        <button onClick={() => respond("accept")} disabled={busy} className={buttonClass("primary", "sm")}>
          Accept
        </button>
      </div>
    </li>
  );
}
