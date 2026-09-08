import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { SkillCategory } from "@ipskill/shared";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { createEndorsement } from "@/lib/endorsements";
import { createNotification } from "@/lib/notifications";

const VALID_SKILLS: SkillCategory[] = [
  "Backend",
  "Frontend",
  "Database",
  "DevOps",
  "Cloud",
  "Problem Solving",
  "Communication",
  "Leadership",
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json();
  const endorseeGithubId = typeof body?.endorseeGithubId === "string" ? body.endorseeGithubId : "";
  const skillCategory = body?.skillCategory;
  const comment = typeof body?.comment === "string" && body.comment.trim() ? body.comment.trim() : null;

  if (!endorseeGithubId || !VALID_SKILLS.includes(skillCategory)) {
    return NextResponse.json({ error: "endorseeGithubId and a valid skillCategory are required" }, { status: 400 });
  }
  if (endorseeGithubId === session.githubId) {
    return NextResponse.json({ error: "You can't endorse yourself." }, { status: 400 });
  }

  try {
    await createEndorsement(session.githubId, endorseeGithubId, skillCategory, comment);
    void createNotification(endorseeGithubId, {
      type: "endorsement_received",
      title: `New endorsement — ${skillCategory}`,
      body: comment ? `"${comment}"` : "A developer endorsed one of your skills.",
      link: "/dashboard/profile",
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to endorse" },
      { status: 500 }
    );
  }
}
