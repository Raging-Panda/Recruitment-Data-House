import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { LinkProvider } from "./linked-accounts";

/**
 * Signs/verifies the OAuth `state` param for the account-linking flow in
 * app/api/link/*. This deliberately doesn't go through NextAuth at all —
 * see the big comment in app/api/link/start/[provider]/route.ts for why —
 * so it needs its own CSRF-safe state, hand-rolled the same way any OAuth
 * client would: a signed, expiring token (who's linking, to what) paired
 * with a same-value httpOnly cookie the callback must match (the standard
 * "double-submit" defense — a signed state alone stops tampering but not
 * an attacker who captures/replays a victim's callback URL to link their
 * own external account onto the victim's session).
 */

const TTL_MS = 10 * 60 * 1000;
export const LINK_STATE_COOKIE = "ipskill_link_nonce";

interface LinkStatePayload {
  ownerId: string;
  provider: LinkProvider;
  nonce: string;
  exp: number;
}

function sign(payload: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createLinkState(ownerId: string, provider: LinkProvider): { state: string; nonce: string } {
  const nonce = randomBytes(16).toString("base64url");
  const payload: LinkStatePayload = { ownerId, provider, nonce, exp: Date.now() + TTL_MS };
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(json);
  return { state: `${json}.${signature}`, nonce };
}

/** Returns the payload if — and only if — the signature is valid, it
 * hasn't expired, and `cookieNonce` (read back from the request) matches
 * the nonce embedded in the state. Null on any failure; callers don't get
 * to distinguish which check failed, same "a dead/tampered link looks the
 * same either way" posture as public-profile-link.ts. */
export function verifyLinkState(state: string, cookieNonce: string | undefined): LinkStatePayload | null {
  const [json, signature] = state.split(".");
  if (!json || !signature) return null;

  let expected: string;
  try {
    expected = sign(json);
  } catch {
    return null;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: LinkStatePayload;
  try {
    payload = JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload.ownerId || !payload.provider || !payload.nonce || !payload.exp) return null;
  if (Date.now() > payload.exp) return null;
  if (!cookieNonce || cookieNonce !== payload.nonce) return null;

  return payload;
}
