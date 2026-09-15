"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast-provider";
import { buttonClass } from "@/lib/button-styles";

export function ReferralCard() {
  const showToast = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => res.json())
      .then((data) => {
        setCode(data.code ?? null);
        setCount(data.count ?? 0);
      })
      .catch(() => {});
  }, []);

  const link = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/login?ref=${code}` : "";

  function copy() {
    navigator.clipboard.writeText(link).then(() => showToast("Link copied"));
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
      <h3 className="text-sm font-semibold text-heading">Refer a Developer</h3>
      <p className="mt-1 text-xs text-text-muted">
        Share your link — {count} {count === 1 ? "signup" : "signups"} so far.
      </p>
      {code && (
        <div className="mt-3 flex gap-2">
          <input
            readOnly
            value={link}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs text-heading"
          />
          <button onClick={copy} className={buttonClass("subtle", "sm")}>
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
