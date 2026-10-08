"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-heading">Something went wrong</h1>
      <p className="mt-2 text-sm text-text-secondary">
        We&apos;ve been notified. You can try again, and your session is unaffected.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-full bg-primary-gradient px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
