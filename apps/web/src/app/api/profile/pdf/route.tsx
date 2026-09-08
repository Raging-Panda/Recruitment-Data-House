import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import type { Endorsement } from "@ipskill/shared";
import { authOptions } from "@/lib/auth";
import { loadDeveloperHubData } from "@/lib/developer-data";
import { getCandidateProfileOverrideSafe } from "@/lib/candidate-profile";
import { getEndorsementsFor } from "@/lib/endorsements";
import { isDemoAccount } from "@/lib/demo-mode";
import { isTestAccount } from "@/lib/test-mode";
import { DEMO_ENDORSEMENTS } from "@/lib/demo-data";
import { ProfilePdfDocument } from "@/lib/profile-pdf-document";

/**
 * Read-only export of the signed-in candidate's own profile — unlike every
 * other write-gated route in the app, there's no reason to block this for
 * the demo account (it renders existing data, nothing is persisted).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const [{ profile, activity, skillFingerprint }, override] = await Promise.all([
      loadDeveloperHubData(session.accessToken, session.githubId),
      getCandidateProfileOverrideSafe(session.githubId),
    ]);
    const displayName = override?.displayName ?? profile.name;

    let endorsements: Endorsement[] = [];
    if (isDemoAccount(session.githubId)) {
      endorsements = DEMO_ENDORSEMENTS[session.githubId] ?? [];
    } else if (!isTestAccount(session.githubId)) {
      try {
        endorsements = await getEndorsementsFor(session.githubId);
      } catch {
        endorsements = [];
      }
    }

    const topLanguages = activity.languageBreakdown.slice(0, 6).map((l) => l.language);

    const buffer = await renderToBuffer(
      <ProfilePdfDocument
        profile={profile}
        displayName={displayName}
        skillFingerprint={skillFingerprint}
        topLanguages={topLanguages}
        endorsements={endorsements}
      />
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ipskill-${profile.githubLogin}-profile.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
