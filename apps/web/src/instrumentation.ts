import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("../sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("../sentry.edge.config");
}

// Called by Next versions that support it (15+); a no-op hook on 14.2,
// where errors are captured by the SDK's own instrumentation instead.
export const onRequestError = Sentry.captureRequestError;
