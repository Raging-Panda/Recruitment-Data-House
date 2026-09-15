"use client";

import { useState } from "react";
import { buttonClass } from "@/lib/button-styles";
import { useToast } from "@/components/toast-provider";

export function FollowButton({
  targetId,
  initialFollowing,
  readOnly = false,
}: {
  targetId: string;
  initialFollowing: boolean;
  readOnly?: boolean;
}) {
  const showToast = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/social/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed");
      }
      setFollowing(!following);
      showToast(following ? "Unfollowed" : "Following");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  if (readOnly) return null;

  return (
    <button onClick={toggle} disabled={busy} className={buttonClass(following ? "subtle" : "primary", "sm")}>
      {following ? "Following" : "Follow"}
    </button>
  );
}
