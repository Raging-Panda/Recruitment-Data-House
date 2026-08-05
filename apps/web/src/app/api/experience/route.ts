import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToWorkExperience } from "@/lib/experience";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("work_experience")
    .select("*")
    .eq("github_id", session.githubId)
    .order("start_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data.map(rowToWorkExperience) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { company, role, location, startDate, endDate, isCurrent, description } = body ?? {};

  if (!company || !role || !startDate) {
    return NextResponse.json(
      { error: "company, role, and startDate are required" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("work_experience")
    .insert({
      github_id: session.githubId,
      company,
      role,
      location: location ?? null,
      start_date: startDate,
      end_date: isCurrent ? null : (endDate ?? null),
      is_current: Boolean(isCurrent),
      description: description ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: rowToWorkExperience(data) }, { status: 201 });
}
