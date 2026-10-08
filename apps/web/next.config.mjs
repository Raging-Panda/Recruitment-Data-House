import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ipskill/shared"],
  // Required on Next 14.2 for src/instrumentation.ts to run (stable from 15).
  experimental: { instrumentationHook: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      // Google account avatars (Google sign-in) — next/image rejects any
      // remote host not explicitly allowlisted here.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // LinkedIn profile pictures (LinkedIn sign-in). Added preemptively,
      // same lesson as the Google host above — unverified against a real
      // LinkedIn login yet, since that needs a real LinkedIn OAuth app.
      { protocol: "https", hostname: "media.licdn.com" },
    ],
  },
};

// Source-map upload (readable production stack traces) needs a Sentry auth
// token; without one it is switched off so builds neither fail nor try to
// reach Sentry. Set SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT in
// Vercel to turn it on.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  telemetry: false,
  disableLogger: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
