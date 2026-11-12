/**
 * Who operates IPSkill, as named in the privacy policy and terms. Under
 * POPIA the company is the "responsible party" and its owner is the
 * Information Officer, reachable at LEGAL_EMAIL. Change LEGAL_UPDATED
 * whenever either page's wording changes.
 */
export const COMPANY_NAME = "Blackline Technology";
export const COMPANY_ADDRESS = "Brackenfell, Western Cape, 7560, South Africa";
export const LEGAL_EMAIL = "emilem364@gmail.com";
export const LEGAL_UPDATED = "12 November 2026";

/**
 * Which version of the privacy policy a POPIA consent covers — stored with
 * every consent record (lib/consent.ts). Bump it only when what people
 * consent to changes: everyone is then asked again on their next visit.
 * Kept apart from LEGAL_UPDATED so a wording fix doesn't re-ask everyone.
 */
export const CONSENT_VERSION = "2026-11-06";
