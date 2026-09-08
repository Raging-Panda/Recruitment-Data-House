import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToFeaturedProject, FEATURED_PROJECT_SELECT } from "@/lib/featured-projects";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";

const MAX_BLURB = 400;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.blurb === "string") {
    const blurb = body.blurb.trim();
    if (!blurb) {
      return NextResponse.json({ error: "blurb cannot be empty" }, { status: 400 });
    }
    if (blurb.length > MAX_BLURB) {
      return NextResponse.json(
        { error: `blurb must be ${MAX_BLURB} characters or fewer` },
        { status: 400 }
      );
    }
    update.blurb = blurb;
  }
  if (typeof body.repoUrl === "string") {
    update.repo_url = body.repoUrl.trim() || null;
  }
  if (Array.isArray(body.languages)) {
    update.languages = body.languages
      .filter((l: unknown): l is string => typeof l === "string")
      .slice(0, 8);
  }
  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
    update.sort_order = body.sortOrder;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("featured_projects")
    .update(update)
    // Scoping by github_id as well as id means a request for someone
    // else's pin silently matches zero rows rather than touching it.
    .eq("id", params.id)
    .eq("github_id", session.githubId)
    .select(FEATURED_PROJECT_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ entry: rowToFeaturedProject(data) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const { error } = await getSupabaseAdmin()
    .from("featured_projects")
    .delete()
    .eq("id", params.id)
    .eq("github_id", session.githubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
