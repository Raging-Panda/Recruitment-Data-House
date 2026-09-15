import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGithubAccessToken } from "@/lib/github-connection";
import { loadDeveloperHubData } from "@/lib/developer-data";
import { getCandidateProfileOverrideSafe } from "@/lib/candidate-profile";
import { createAttestation } from "@/lib/attestation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const githubToken = await getGithubAccessToken(session);
  if (!githubToken) {
    return NextResponse.json({ error: "Connect GitHub to generate an attestation" }, { status: 400 });
  }

  const [{ profile, skillFingerprint }, override] = await Promise.all([
    loadDeveloperHubData(githubToken, session.githubId),
    getCandidateProfileOverrideSafe(session.githubId),
  ]);

  const attestation = createAttestation({
    githubId: session.githubId,
    displayName: override?.displayName ?? profile.name,
    overallScore: profile.overallScore,
    skillFingerprint,
    issuedAt: new Date().toISOString(),
  });

  return NextResponse.json(attestation);
}
