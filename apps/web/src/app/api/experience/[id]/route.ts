import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToWorkExperience } from "@/lib/experience";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { company, role, location, startDate, endDate, isCurrent, description } = body ?? {};

  const { data, error } = await getSupabaseAdmin()
    .from("work_experience")
    .update({
      ...(company !== undefined && { company }),
      ...(role !== undefined && { role }),
      ...(location !== undefined && { location }),
      ...(startDate !== undefined && { start_date: startDate }),
      ...(isCurrent !== undefined && { is_current: isCurrent, end_date: isCurrent ? null : endDate }),
      ...(description !== undefined && { description }),
      updated_at: new Date().toISOString(),
    })
    // Scoping by github_id (not just id) means a request for someone else's
    // entry silently matches zero rows instead of ever touching their data.
    .eq("id", params.id)
    .eq("github_id", session.githubId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ entry: rowToWorkExperience(data) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await getSupabaseAdmin()
    .from("work_experience")
    .delete()
    .eq("id", params.id)
    .eq("github_id", session.githubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
