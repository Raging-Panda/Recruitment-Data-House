import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (isDemoAccount(session.githubId)) {
    return NextResponse.json({ success: true });
  }

  const { error } = await getSupabaseAdmin()
    .from("notifications")
    .update({ is_read: true })
    .eq("github_id", session.githubId)
    .eq("is_read", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
