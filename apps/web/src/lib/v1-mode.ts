/**
 * v1 is the full app with a fixed set of features hidden, not a separate
 * codebase — set NEXT_PUBLIC_V1_MODE=true in that deployment's env to turn
 * on the cut. Everything else (auth, GitHub-derived skill fingerprint,
 * profile, projects, directory/recruiter search) stays as-is.
 */
export const V1_MODE = process.env.NEXT_PUBLIC_V1_MODE === "true";

/** Routes under /dashboard that don't exist in v1 — hit one directly and
 * it 404s via notFound() rather than silently rendering. */
export const V1_HIDDEN_ROUTES = [
  "/dashboard/messages",
  "/dashboard/interviews",
  "/dashboard/growth",
  "/dashboard/achievements",
  "/dashboard/feed",
  "/dashboard/roles",
] as const;
