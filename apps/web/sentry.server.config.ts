import * as Sentry from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent } from "./src/lib/sentry-scrub";

// One public DSN env var for client and server. A DSN only lets someone
// *send* events to the project, so it is safe to expose; unset = Sentry is a
// complete no-op (no network, no overhead beyond the import).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  // Errors only — no performance tracing, to stay inside the free tier.
  tracesSampleRate: 0,
  sendDefaultPii: false,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
  integrations: [
    // NextAuth reports its failures (OAUTH_CALLBACK_ERROR, etc.) through
    // console.error rather than throwing, so without this the very errors
    // that cost an afternoon of log-digging would never reach Sentry.
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
  ],
});
