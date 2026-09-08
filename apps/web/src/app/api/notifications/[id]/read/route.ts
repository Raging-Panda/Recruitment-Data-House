import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // The demo inbox is hardcoded fixture data, not real rows — nothing to
  // persist, but the UI can still optimistically mark it read client-side.
  if (isDemoAccount(session.githubId)) {
    return NextResponse.json({ success: true });
  }

  const { error } = await getSupabaseAdmin()
    .from("notifications")
    .update({ is_read: true })
    .eq("id", params.id)
    .eq("github_id", session.githubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
