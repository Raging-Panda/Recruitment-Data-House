import { NextRequest, NextResponse } from "next/server";
import { isValidApiKey } from "@/lib/api-keys";
import { getPublicDirectoryEntries } from "@/lib/directory";

/**
 * Scoped, key-authenticated read API for enterprise clients — only ever
 * returns public (visibility="public") directory data, the same data a
 * signed-out visitor to /directory could already see, just machine-
 * readable. Auth: `Authorization: Bearer <key>` from Settings → API Keys.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const key = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!(await isValidApiKey(key))) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const entries = await getPublicDirectoryEntries().catch(() => []);
  return NextResponse.json({
    developers: entries.map((e) => ({
      handle: e.handle,
      displayName: e.displayName,
      headline: e.headline,
      location: e.location,
      overallScore: e.overallScore,
      topLanguages: e.topLanguages,
      availableForOpportunities: e.availableForOpportunities,
      profileUrl: e.handle ? `/u/${e.handle}` : null,
    })),
  });
}
