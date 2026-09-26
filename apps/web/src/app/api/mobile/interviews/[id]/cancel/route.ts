import { NextRequest, NextResponse } from "next/server";
import { resolveMobileGithubId } from "@/lib/mobile-auth";
import { cancelInterviewAndNotify } from "@/lib/interviews";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const githubId = await resolveMobileGithubId(req);
  if (!githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const cancelled = await cancelInterviewAndNotify(params.id, githubId);
  if (!cancelled) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ interview: cancelled });
}
