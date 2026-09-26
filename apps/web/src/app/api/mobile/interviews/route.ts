import { NextRequest, NextResponse } from "next/server";
import { resolveMobileGithubId } from "@/lib/mobile-auth";
import { listInterviewsFor } from "@/lib/interviews";
import { getDirectoryEntriesByIds } from "@/lib/directory";

/** Mobile is candidate-only today (no Directory browsing, no premium/
 * recruiter mode), so in practice every result here has the viewer as
 * candidateId — still resolves both sides generically in case that ever
 * changes. Enriched with the other party's name for the same reason as
 * the messages list: no directory-fetching of its own on the client. */
export async function GET(req: NextRequest) {
  const githubId = await resolveMobileGithubId(req);
  if (!githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const interviews = await listInterviewsFor(githubId).catch(() => []);
  const otherIds = interviews.map((i) => (i.candidateId === githubId ? i.recruiterId : i.candidateId));
  const others = await getDirectoryEntriesByIds([...new Set(otherIds)]).catch(() => []);
  const otherMap = new Map(others.map((o) => [o.githubId, o.displayName]));

  const enriched = interviews.map((i) => ({
    ...i,
    otherName: otherMap.get(i.candidateId === githubId ? i.recruiterId : i.candidateId) ?? "them",
  }));

  return NextResponse.json({ interviews: enriched });
}
