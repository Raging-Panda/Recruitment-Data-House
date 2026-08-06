import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCandidateProfileOverride } from "@/lib/candidate-profile";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const override = await getCandidateProfileOverride(session.githubId);
  return NextResponse.json({ override });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";

  if (!displayName) {
    return NextResponse.json({ error: "displayName is required" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("candidate_profile")
    .upsert(
      { github_id: session.githubId, display_name: displayName, updated_at: new Date().toISOString() },
      { onConflict: "github_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    override: { githubId: data.github_id, displayName: data.display_name, updatedAt: data.updated_at },
  });
}
