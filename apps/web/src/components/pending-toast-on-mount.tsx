"use client";

import { useEffect } from "react";
import { useToast } from "./toast-provider";
import { consumePendingToast } from "@/lib/pending-toast";

/** Shows a toast queued before a redirect to this page — sign-out lands on
 * the home page, which has no LoginCard to pick it up. */
export function PendingToastOnMount() {
  const showToast = useToast();
  useEffect(() => {
    const pending = consumePendingToast();
    if (pending) showToast(pending.message, pending.variant);
  }, [showToast]);
  return null;
}
