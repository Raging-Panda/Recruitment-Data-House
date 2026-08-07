import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { addCandidateToShortlist, removeCandidateFromShortlist } from "@/lib/shortlists";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json();
  const candidateGithubId = typeof body?.candidateGithubId === "string" ? body.candidateGithubId : "";
  if (!candidateGithubId) {
    return NextResponse.json({ error: "candidateGithubId is required" }, { status: 400 });
  }

  try {
    const added = await addCandidateToShortlist(session.githubId, params.id, candidateGithubId);
    return NextResponse.json({ added });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add candidate" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const candidateGithubId = req.nextUrl.searchParams.get("candidateGithubId");
  if (!candidateGithubId) {
    return NextResponse.json({ error: "candidateGithubId is required" }, { status: 400 });
  }

  try {
    await removeCandidateFromShortlist(session.githubId, params.id, candidateGithubId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove candidate" },
      { status: 500 }
    );
  }
}
