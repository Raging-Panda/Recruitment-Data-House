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

function canonical(payload: AttestationPayload): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
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
