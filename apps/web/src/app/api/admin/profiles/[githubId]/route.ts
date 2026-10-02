import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export async function PUT(req: NextRequest, { params }: { params: { githubId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!isAdmin(session.githubId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Ids like "google:<sub>" arrive percent-encoded in the path segment.
  const targetId = decodeURIComponent(params.githubId);
  const body = await req.json().catch(() => null);

  const update: Record<string, unknown> = {
    github_id: targetId,
    updated_by: session.githubId,
    updated_at: new Date().toISOString(),
  };
  if (typeof body?.adminVerified === "boolean") update.admin_verified = body.adminVerified;
  if (typeof body?.hidden === "boolean") update.hidden = body.hidden;
  if (typeof body?.notes === "string") update.notes = body.notes.slice(0, 1000) || null;
  if (Object.keys(update).length === 3) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("profile_verifications")
    .upsert(update, { onConflict: "github_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
