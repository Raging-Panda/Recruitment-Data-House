"use client";

import { useEffect, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IPSkillLogo } from "./ipskill-logo";
import { ArrowRightIcon } from "./icons";
import { useToast } from "./toast-provider";
import { setPendingToast, consumePendingToast } from "@/lib/pending-toast";

const DEMO_EMAIL = "admin@admin.com";
const DEMO_PASSWORD = "1234";

export function LoginCard() {
  const router = useRouter();
  const showToast = useToast();
  const [testLoginAvailable, setTestLoginAvailable] = useState(false);
  const [demoEmail, setDemoEmail] = useState(DEMO_EMAIL);
  const [demoPassword, setDemoPassword] = useState(DEMO_PASSWORD);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((providers) => setTestLoginAvailable(Boolean(providers?.["test-account"])))
      .catch(() => setTestLoginAvailable(false));
  }, []);

  // Catches the toast set by Sidebar right before sign-out redirected here —
  // a toast fired on that page would just vanish with the navigation.
  useEffect(() => {
    const pending = consumePendingToast();
    if (pending) showToast(pending.message, pending.variant);
  }, [showToast]);

  function signInWithGithub() {
    setPendingToast("Signed in with GitHub");
    signIn("github", { callbackUrl: "/dashboard/profile" });
  }

  async function handleDemoSubmit(e: FormEvent) {
    e.preventDefault();
    setDemoError(null);
    setIsSubmittingDemo(true);
    const res = await signIn("demo-account", {
      email: demoEmail,
      password: demoPassword,
      redirect: false,
    });
    setIsSubmittingDemo(false);
    if (res?.error) {
      setDemoError("Invalid demo credentials.");
    } else {
      setPendingToast("Viewing the demo profile");
      router.push("/dashboard/profile");
    }
  }

  function signInAsTestUser() {
    setPendingToast("Signed in as Test Developer");
    signIn("test-account", { callbackUrl: "/dashboard/profile" });
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-background-elevated p-8 text-center">
      <div className="flex justify-center">
        <IPSkillLogo size={96} />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-heading">IPSkill</h1>
      <p className="mt-1 text-xs uppercase tracking-widest text-text-secondary">
        Unique Skills, Perfect Match.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={signInWithGithub}
          className="flex items-center justify-center gap-2 rounded-full bg-primary-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Get Started <ArrowRightIcon size={16} />
        </button>

        <button
          disabled
          title="Google sign-in is not wired up yet — use GitHub for now"
          className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-400 opacity-50"
        >
          Continue with Google
        </button>

        <button
          onClick={signInWithGithub}
          className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
        >
          <GithubMark /> Continue with GitHub
        </button>

        <button
          onClick={signInWithGithub}
          className="rounded-full border border-surface-border bg-surface/60 px-4 py-3 text-sm font-medium text-text-secondary transition hover:text-heading"
        >
          Log in
        </button>

        {testLoginAvailable && (
          <button
            onClick={signInAsTestUser}
            className="rounded-full border border-dashed border-accent-green/50 px-4 py-3 text-sm font-medium text-accent-green transition hover:bg-accent-green/10"
          >
            Continue as Test User (dev only)
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-text-muted">
        <div className="h-px flex-1 bg-surface-border" />
        View a demo profile
        <div className="h-px flex-1 bg-surface-border" />
      </div>

      <form onSubmit={handleDemoSubmit} className="mt-4 flex flex-col gap-2 text-left">
        <input
          type="email"
          value={demoEmail}
          onChange={(e) => setDemoEmail(e.target.value)}
          placeholder="admin@admin.com"
          className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none"
        />
        <input
          type="password"
          value={demoPassword}
          onChange={(e) => setDemoPassword(e.target.value)}
          placeholder="1234"
          className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none"
        />
        {demoError && <p className="text-xs text-accent-red">{demoError}</p>}
        <button
          type="submit"
          disabled={isSubmittingDemo}
          className="rounded-full border border-primary/40 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:opacity-50"
        >
          {isSubmittingDemo ? "Loading demo…" : "View Demo Profile"}
        </button>
        <p className="text-center text-xs text-text-muted">
          Prefilled with the public demo login — a fully populated proof-of-concept profile.
        </p>
      </form>
    </div>
  );
}

function GithubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 5.01 3.25 9.26 7.77 10.76.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.16.69-3.83-1.34-3.83-1.34-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.33.95.1-.74.4-1.25.72-1.54-2.52-.29-5.17-1.26-5.17-5.61 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.16a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.47 3.15-1.16 3.15-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.36-2.65 5.31-5.18 5.59.41.35.77 1.04.77 2.11 0 1.53-.01 2.75-.01 3.13 0 .3.2.66.79.55 4.52-1.5 7.77-5.75 7.77-10.76C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  );
}
