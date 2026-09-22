import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { SkillCategory } from "@ipskill/shared";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SKILL_PROOF_SELECT } from "@/lib/skill-proofs";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { isSafeHttpUrl } from "@/lib/url-validation";

const VALID_CATEGORIES: SkillCategory[] = [
  "Backend",
  "Frontend",
  "Database",
  "DevOps",
  "Cloud",
  "Problem Solving",
  "Communication",
  "Leadership",
];
const MAX_PROOFS = 12;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const skillCategory = body?.skillCategory as SkillCategory | undefined;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!skillCategory || !VALID_CATEGORIES.includes(skillCategory) || !title || !url) {
    return NextResponse.json({ error: "skillCategory, title, and url are required" }, { status: 400 });
  }
  if (!isSafeHttpUrl(url)) {
    return NextResponse.json({ error: "url must be a valid http(s) URL" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("skill_proofs")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", session.githubId);
  if ((count ?? 0) >= MAX_PROOFS) {
    return NextResponse.json({ error: `You can add at most ${MAX_PROOFS} proof links` }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("skill_proofs")
    .insert({ owner_id: session.githubId, skill_category: skillCategory, title, url })
    .select(SKILL_PROOF_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    {
      entry: {
        id: data.id,
        githubId: data.owner_id,
        skillCategory: data.skill_category,
        title: data.title,
        url: data.url,
        createdAt: data.created_at,
      },
    },
    { status: 201 }
  );
}
