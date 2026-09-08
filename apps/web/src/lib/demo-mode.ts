import { NextResponse } from "next/server";

/**
 * A public, always-on "proof of concept" account — unlike the ALLOW_TEST_LOGIN
 * bypass (dev-only, hidden unless explicitly enabled), this is meant to be
 * clicked by anyone evaluating the product, so it's a real credentials login
 * rather than an env-gated fixture.
 */
export const DEMO_EMAIL = "admin@admin.com";
export const DEMO_PASSWORD = "1234";
export const DEMO_GITHUB_ID = "900000002";
export const DEMO_ACCESS_TOKEN = "demo-mode";

export function isDemoAccount(githubId: string | null | undefined): boolean {
  return githubId === DEMO_GITHUB_ID;
}

/** Shared write guard for API routes — the demo account is public, so writes
 * are rejected rather than persisted, keeping the showcase data identical
 * for every visitor. */
export function demoWriteBlockedResponse() {
  return NextResponse.json(
    { error: "This is a shared demo account — changes aren't saved." },
    { status: 403 }
  );
}
