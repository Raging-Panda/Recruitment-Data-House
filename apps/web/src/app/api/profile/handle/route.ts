import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { validateHandle, isHandleTaken } from "@/lib/handle";
import { isSafeHttpUrl } from "@/lib/url-validation";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body?.handle === "string" && body.handle.trim()) {
    const result = validateHandle(body.handle);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    if (await isHandleTaken(result.handle, session.githubId)) {
      return NextResponse.json({ error: "That handle is already taken" }, { status: 409 });
    }
    update.handle = result.handle;
  }

  if (body?.visibility === "public" || body?.visibility === "private") {
    update.visibility = body.visibility;
  }

  if (typeof body?.company === "string") {
    update.company = body.company.trim() || null;
  }

  if (typeof body?.videoIntroUrl === "string") {
    const url = body.videoIntroUrl.trim();
    if (url && !isSafeHttpUrl(url)) {
      return NextResponse.json({ error: "videoIntroUrl must be a valid http(s) URL" }, { status: 400 });
    }
    update.video_intro_url = url || null;
  }

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("candidate_profile")
    .upsert({ github_id: session.githubId, ...update }, { onConflict: "github_id" })
    .select("handle, visibility, company, video_intro_url")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "That handle is already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ identity: data });
}
