import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCandidateProfileOverride } from "@/lib/candidate-profile";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";

const MAX_ABOUT = 1200;
const MAX_CURRENTLY = 140;

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
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("displayName" in body) {
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (!displayName) {
      return NextResponse.json({ error: "displayName cannot be empty" }, { status: 400 });
    }
    update.display_name = displayName;
  }

  // about / currently accept an empty string as an explicit "clear it" —
  // stored as NULL so a blank authored bio falls back to the GitHub one.
  if ("aboutAuthored" in body) {
    if (typeof body.aboutAuthored !== "string") {
      return NextResponse.json({ error: "aboutAuthored must be a string" }, { status: 400 });
    }
    const value = body.aboutAuthored.trim();
    if (value.length > MAX_ABOUT) {
      return NextResponse.json(
        { error: `aboutAuthored must be ${MAX_ABOUT} characters or fewer` },
        { status: 400 }
      );
    }
    update.about_authored = value || null;
  }

  if ("currently" in body) {
    if (typeof body.currently !== "string") {
      return NextResponse.json({ error: "currently must be a string" }, { status: 400 });
    }
    const value = body.currently.trim();
    if (value.length > MAX_CURRENTLY) {
      return NextResponse.json(
        { error: `currently must be ${MAX_CURRENTLY} characters or fewer` },
        { status: 400 }
      );
    }
    update.currently = value || null;
    update.currently_updated_at = value ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "No recognised fields to update" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("candidate_profile")
    .upsert({ github_id: session.githubId, ...update }, { onConflict: "github_id" })
    .select("github_id, display_name, about_authored, currently, currently_updated_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    override: {
      githubId: data.github_id,
      displayName: data.display_name,
      aboutAuthored: data.about_authored,
      currently: data.currently,
      currentlyUpdatedAt: data.currently_updated_at,
      updatedAt: data.updated_at,
    },
  });
}
