import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { SkillFingerprint } from "@ipskill/shared";

/**
 * "Signed profile snapshot" — a tamper-evident, dated attestation of a
 * fingerprint at a point in time. Deliberately not a full PKI/JWT setup:
 * an HMAC over NEXTAUTH_SECRET is enough to prove "this exact payload was
 * issued by IPSkill and hasn't been edited since" without any new
 * infrastructure — no schema needed, nothing to run. Anyone (a recruiter,
 * an ATS) can hit /api/profile/attestation/verify to check one.
 */
export interface AttestationPayload {
  githubId: string;
  displayName: string;
  overallScore: number;
  skillFingerprint: SkillFingerprint;
  issuedAt: string;
}

/**
 * Deterministic JSON with keys sorted at every depth, so the signature covers
 * the whole payload regardless of key order. Not `JSON.stringify(payload,
 * Object.keys(payload).sort())`: a replacer array is an allowlist applied to
 * nested objects too, so it signed skillFingerprint as `{}` and its values
 * could be edited without breaking verification. Undefined values are dropped
 * the way JSON.stringify drops them, so a payload signs the same before and
 * after the JSON round trip through the downloaded file.
 */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonical(item ?? null)).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function sign(payload: AttestationPayload): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
  return createHmac("sha256", secret).update(canonical(payload)).digest("base64url");
}

export function createAttestation(payload: AttestationPayload): { payload: AttestationPayload; signature: string } {
  return { payload, signature: sign(payload) };
}

export function verifyAttestation(payload: AttestationPayload, signature: string): boolean {
  try {
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
