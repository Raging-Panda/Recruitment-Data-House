import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const { error } = await getSupabaseAdmin()
    .from("skill_proofs")
    .delete()
    .eq("id", params.id)
    .eq("owner_id", session.githubId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
