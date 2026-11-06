import { NextResponse } from "next/server";

/**
 * The old public "proof of concept" account. Its login (the demo-account
 * provider and the login page's demo form) was removed before launch, so
 * nobody can sign in as it any more; these guards and the fixture data in
 * demo-data.ts are what's left of it.
 */
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
