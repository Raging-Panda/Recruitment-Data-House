"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

export function MessageButton({ targetId }: { targetId: string }) {
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
      router.push(`/dashboard/messages/${json.conversationId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
      setBusy(false);
    }
  }

  return (
    <button onClick={start} disabled={busy} className={buttonClass("primary", "sm")}>
      Message
    </button>
  );
}
