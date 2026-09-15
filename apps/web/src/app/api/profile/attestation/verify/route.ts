import { NextRequest, NextResponse } from "next/server";
import { verifyAttestation, type AttestationPayload } from "@/lib/attestation";

/** Public, unauthenticated — the whole point of an attestation is that
 * anyone holding one (a recruiter, an ATS) can verify it without an
 * IPSkill login. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const payload = body?.payload as AttestationPayload | undefined;
  const signature = typeof body?.signature === "string" ? body.signature : "";

  if (!payload || !signature) {
    return NextResponse.json({ valid: false, error: "payload and signature are required" }, { status: 400 });
  }

  const valid = verifyAttestation(payload, signature);
  return NextResponse.json({ valid });
}
