/** Shared between the server-only lib/interviews.ts and client components
 * (propose-interview-form.tsx) — kept out of interviews.ts itself since
 * that file is "server-only" and a client component importing anything
 * from it, even a constant, fails the build. */
export const MAX_PROPOSED_SLOTS = 5;
