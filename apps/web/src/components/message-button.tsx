"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

export function MessageButton({
  targetId,
  preference = "open",
}: {
  targetId: string;
  /** The recipient's messaging preference, shown so the sender knows up
   * front whether this lands in their inbox or as a request to accept. */
  preference?: "open" | "request";
}) {
  const router = useRouter();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (json.status === "pending") showToast("Sent as a request — they'll need to accept it.");
      router.push(`/dashboard/messages/${json.conversationId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button onClick={start} disabled={busy} className={buttonClass("primary", "sm")}>
        {preference === "request" ? "Send request" : "Message"}
      </button>
      <span
        className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide ${
          preference === "request" ? "text-amber-500" : "text-emerald-500"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${preference === "request" ? "bg-amber-500" : "bg-emerald-500"}`} />
        {preference === "request" ? "Requires a request" : "Open for messages"}
      </span>
    </div>
  );
}
