"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";

const ERROR_MESSAGES: Record<string, string> = {
  demo: "The shared demo account can't connect accounts.",
  not_configured: "That connection isn't set up on this deployment yet.",
  cancelled: "Connection cancelled.",
  invalid_request: "Something went wrong starting that connection.",
  expired: "That connection attempt expired — try again.",
  session_changed: "You signed out mid-connection — try again.",
  already_linked: "That account is already connected to a different IPSkill profile.",
  failed: "Could not complete that connection.",
};

const PROVIDER_LABELS: Record<string, string> = {
  github: "GitHub",
  google: "Google",
  linkedin: "LinkedIn",
};

/** Reads the ?linked=/?linkError= query params app/api/link/callback/[provider]
 * redirects back with, shows a toast once, then strips them from the URL so
 * a refresh doesn't re-fire it. */
export function LinkStatusToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();

  useEffect(() => {
    const linked = searchParams.get("linked");
    const linkError = searchParams.get("linkError");
    if (!linked && !linkError) return;

    if (linked) {
      showToast(`${PROVIDER_LABELS[linked] ?? linked} connected`);
    } else if (linkError) {
      showToast(ERROR_MESSAGES[linkError] ?? "Could not complete that connection.", "error");
    }

    router.replace("/dashboard/settings");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
