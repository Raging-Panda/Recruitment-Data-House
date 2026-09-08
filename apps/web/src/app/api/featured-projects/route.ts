import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  rowToFeaturedProject,
  FEATURED_PROJECT_SELECT,
  MAX_FEATURED_PROJECTS,
} from "@/lib/featured-projects";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";

const MAX_BLURB = 400;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("featured_projects")
    .select(FEATURED_PROJECT_SELECT)
    .eq("github_id", session.githubId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data.map(rowToFeaturedProject) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const repoName = typeof body?.repoName === "string" ? body.repoName.trim() : "";
  const blurb = typeof body?.blurb === "string" ? body.blurb.trim() : "";
  const repoUrl = typeof body?.repoUrl === "string" && body.repoUrl.trim() ? body.repoUrl.trim() : null;
  const languages = Array.isArray(body?.languages)
    ? body.languages.filter((l: unknown): l is string => typeof l === "string").slice(0, 8)
    : [];

  if (!repoName || !blurb) {
    return NextResponse.json({ error: "repoName and blurb are required" }, { status: 400 });
  }
  if (blurb.length > MAX_BLURB) {
    return NextResponse.json(
      { error: `blurb must be ${MAX_BLURB} characters or fewer` },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { count, error: countError } = await supabase
    .from("featured_projects")
    .select("id", { count: "exact", head: true })
    .eq("github_id", session.githubId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  if ((count ?? 0) >= MAX_FEATURED_PROJECTS) {
    return NextResponse.json(
      { error: `You can feature at most ${MAX_FEATURED_PROJECTS} projects` },
      { status: 409 }
    );
  }

  const sortOrder =
    typeof body?.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? body.sortOrder
      : (count ?? 0);

  const { data, error } = await supabase
    .from("featured_projects")
    .insert({
      github_id: session.githubId,
      repo_name: repoName,
      repo_url: repoUrl,
      blurb,
      languages,
      sort_order: sortOrder,
    })
    .select(FEATURED_PROJECT_SELECT)
    .single();

  if (error) {
    // 23505 = unique_violation — this repo is already featured.
    const status = (error as { code?: string }).code === "23505" ? 409 : 500;
    const message =
      status === 409 ? "That repository is already featured" : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ entry: rowToFeaturedProject(data) }, { status: 201 });
}
