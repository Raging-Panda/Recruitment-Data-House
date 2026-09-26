import { NextRequest, NextResponse } from "next/server";
import { resolveMobileGithubId } from "@/lib/mobile-auth";
import { bookInterviewAndNotify } from "@/lib/interviews";

const ERROR_STATUS = { not_found: 404, invalid_slot: 400, no_longer_open: 409 } as const;
const ERROR_MESSAGE = {
  not_found: "Not found",
  invalid_slot: "That slot wasn't one of the proposed times",
  no_longer_open: "This request is no longer open",
} as const;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const githubId = await resolveMobileGithubId(req);
  if (!githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const slot = typeof body?.slot === "string" ? body.slot : "";
  if (!slot) return NextResponse.json({ error: "slot is required" }, { status: 400 });

  const result = await bookInterviewAndNotify(params.id, githubId, slot);
  if (!result.ok) {
    return NextResponse.json({ error: ERROR_MESSAGE[result.reason] }, { status: ERROR_STATUS[result.reason] });
  }
  return NextResponse.json({ interview: result.interview });
}
