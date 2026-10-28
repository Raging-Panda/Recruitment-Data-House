import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoAccount, demoWriteBlockedResponse } from "@/lib/demo-mode";
import { deleteAccount } from "@/lib/account-deletion";

/** What the person types in DeleteAccountCard — checked here too, so a
 * stray request can't delete an account without it. */
const DELETE_CONFIRMATION = "DELETE";

/** Deletes the signed-in account and everything it owns. The client signs
 * out afterwards; the session cookie on its own no longer points at any
 * data, and signing in again starts a new, empty account. */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  if (body?.confirm !== DELETE_CONFIRMATION) {
    return NextResponse.json({ error: `Type ${DELETE_CONFIRMATION} to confirm` }, { status: 400 });
  }

  try {
    await deleteAccount(session.githubId);
  } catch (err) {
    console.error("[account] delete failed", err);
    return NextResponse.json(
      { error: "Your account couldn't be fully deleted. Please try again." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
