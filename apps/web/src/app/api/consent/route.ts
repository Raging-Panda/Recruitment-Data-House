import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordConsent } from "@/lib/consent";
import { CONSENT_VERSION } from "@/lib/legal";

/** Records the signed-in account's POPIA consent from /consent. The client
 * sends the version it showed, so a page left open across a policy change
 * can't consent to a version the person never saw. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (body?.version !== CONSENT_VERSION) {
    return NextResponse.json(
      { error: "The privacy policy has changed. Reload the page to see the latest version." },
      { status: 409 }
    );
  }

  try {
    await recordConsent(session.githubId);
  } catch (err) {
    console.error("[consent] record failed", err);
    return NextResponse.json({ error: "Your consent couldn't be saved. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
