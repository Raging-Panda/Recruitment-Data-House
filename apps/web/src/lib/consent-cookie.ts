import { CONSENT_VERSION } from "./legal";

/**
 * Carries the login page's consent tick box across the OAuth round trip:
 * the box is ticked here, but the account only exists once GitHub, Google
 * or LinkedIn sends the visitor back, which is when lib/auth.ts reads this
 * cookie and records the consent. Short-lived, and holds only the version.
 * Kept apart from lib/consent.ts (server-only) so the login card can use it.
 */
export const CONSENT_COOKIE = "ipskill_consent";

/** Client-side: set the cookie when the box is ticked, clear it otherwise. */
export function rememberConsent(given: boolean): void {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = given
    ? `${CONSENT_COOKIE}=${CONSENT_VERSION}; path=/; max-age=3600; samesite=lax${secure}`
    : `${CONSENT_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
}
