import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { deleteLinkedAccount, type LinkProvider } from "@/lib/linked-accounts";

const VALID_PROVIDERS: LinkProvider[] = ["github", "google", "linkedin"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const provider = body?.provider as LinkProvider | undefined;
  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  try {
    await deleteLinkedAccount(session.githubId, provider);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not unlink" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
