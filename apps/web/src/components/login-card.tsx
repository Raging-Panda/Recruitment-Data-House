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

const AUTH_INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

export function LoginCard() {
  const router = useRouter();
  const showToast = useToast();
  const [testLoginAvailable, setTestLoginAvailable] = useState(false);
  const [demoEmail, setDemoEmail] = useState(DEMO_EMAIL);
  const [demoPassword, setDemoPassword] = useState(DEMO_PASSWORD);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

  const [authMode, setAuthMode] = useState<"closed" | "login" | "signup">("closed");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

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

  function signInWithGoogle() {
    setPendingToast("Signed in with Google");
    signIn("google", { callbackUrl: "/dashboard/profile" });
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

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);
    try {
      if (authMode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword, displayName: authName }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not create account");
      }
      const result = await signIn("credentials", {
        email: authEmail,
        password: authPassword,
        redirect: false,
      });
      if (result?.error) throw new Error("Incorrect email or password");
      setPendingToast(authMode === "signup" ? "Account created" : "Signed in");
      router.push("/dashboard/profile");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  function signInAsTestUser() {
    setPendingToast("Signed in as Test Developer");
    signIn("test-account", { callbackUrl: "/dashboard/profile" });
  }

  function signInAsTestGoogleUser() {
    setPendingToast("Signed in as Test Google User");
    signIn("test-google-account", { callbackUrl: "/dashboard/profile" });
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
          onClick={signInWithGoogle}
          title="Your fingerprint, projects, and heatmap come from GitHub — Google gets you a lighter profile for now, and there's no account linking yet"
          className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
        >
          <GoogleMark /> Continue with Google
        </button>

        <button
          onClick={signInWithGithub}
          className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
        >
          <GithubMark /> Continue with GitHub
        </button>

        {authMode === "closed" && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAuthMode("login");
                setAuthError(null);
              }}
              className="flex-1 rounded-full border border-surface-border bg-surface/60 px-4 py-3 text-sm font-medium text-text-secondary transition hover:text-heading"
            >
              Log in
            </button>
            <button
              onClick={() => {
                setAuthMode("signup");
                setAuthError(null);
              }}
              className="flex-1 rounded-full border border-surface-border bg-surface/60 px-4 py-3 text-sm font-medium text-text-secondary transition hover:text-heading"
            >
              Sign up
            </button>
          </div>
        )}

        {authMode !== "closed" && (
          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-2 text-left">
            {authMode === "signup" && (
              <input
                type="text"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Full name"
                className={AUTH_INPUT_CLASS}
              />
            )}
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              className={AUTH_INPUT_CLASS}
            />
            <input
              type="password"
              required
              minLength={authMode === "signup" ? 8 : undefined}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder={authMode === "signup" ? "Password (min. 8 characters)" : "Password"}
              className={AUTH_INPUT_CLASS}
            />
            {authError && <p className="text-xs text-accent-red">{authError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAuthMode("closed")}
                className="flex-1 rounded-full border border-surface-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:text-heading"
                disabled={isSubmittingAuth}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="flex-1 rounded-full bg-primary-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isSubmittingAuth
                  ? "Please wait…"
                  : authMode === "signup"
                    ? "Create account"
                    : "Log in"}
              </button>
            </div>
            <p className="text-center text-xs text-text-muted">
              {authMode === "signup"
                ? "No GitHub or Google — a lighter profile until you connect one."
                : ""}
            </p>
          </form>
        )}

        {testLoginAvailable && (
          <button
            onClick={signInAsTestUser}
            className="rounded-full border border-dashed border-accent-green/50 px-4 py-3 text-sm font-medium text-accent-green transition hover:bg-accent-green/10"
          >
            Continue as Test User (dev only)
          </button>
        )}

        {testLoginAvailable && (
          <button
            onClick={signInAsTestGoogleUser}
            title="Simulates a Google sign-in with no GitHub connection — no real Google app needed"
            className="rounded-full border border-dashed border-accent-green/50 px-4 py-3 text-sm font-medium text-accent-green transition hover:bg-accent-green/10"
          >
            Continue as Test Google User (dev only)
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

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.2z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.5c-2 1.5-4.6 2.6-7.6 2.6-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 39.6 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.6 5.5C41.3 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 5.01 3.25 9.26 7.77 10.76.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.16.69-3.83-1.34-3.83-1.34-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.33.95.1-.74.4-1.25.72-1.54-2.52-.29-5.17-1.26-5.17-5.61 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.16a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.47 3.15-1.16 3.15-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.36-2.65 5.31-5.18 5.59.41.35.77 1.04.77 2.11 0 1.53-.01 2.75-.01 3.13 0 .3.2.66.79.55 4.52-1.5 7.77-5.75 7.77-10.76C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  );
}
