"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "./toast-provider";
import { setPendingToast } from "@/lib/pending-toast";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-credentials";

/** Signs straight into the read-only demo profile — the same login the
 * login card pre-fills, without making a visitor find and submit it. */
export function DemoButton({ className }: { className: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function openDemo() {
    setLoading(true);
    const res = await signIn("demo-account", { email: DEMO_EMAIL, password: DEMO_PASSWORD, redirect: false });
    if (res?.error) {
      setLoading(false);
      showToast("The demo isn't available right now.", "error");
      return;
    }
    setPendingToast("Viewing the demo profile");
    router.push("/dashboard/profile");
  }

  return (
    <button type="button" onClick={openDemo} disabled={loading} className={className}>
      {loading ? "Loading demo…" : "View the demo"}
    </button>
  );
}
