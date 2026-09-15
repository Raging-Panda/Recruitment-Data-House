import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { getPlan } from "@/lib/premium";
import { hasRecruiterAccess } from "@/lib/plan";
import { listJobRoles, createJobRole } from "@/lib/job-roles";

export async function GET() {
  const roles = await listJobRoles().catch(() => []);
  return NextResponse.json({ roles });
}

/** Posting a role is a Recruiter Tools (premium_recruiter) action —
 * matches the rest of that section's gate. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const plan = await getPlan(session.githubId);
  if (!hasRecruiterAccess(plan)) {
    return NextResponse.json({ error: "Recruiter Tools is premium" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const company = typeof body?.company === "string" ? body.company.trim() : "";
  if (!title || !company) {
    return NextResponse.json({ error: "title and company are required" }, { status: 400 });
  }

  try {
    const role = await createJobRole({
      title,
      company,
      location: typeof body?.location === "string" ? body.location.trim() || null : null,
      description: typeof body?.description === "string" ? body.description.trim() || null : null,
      requiredSkills: body?.requiredSkills ?? {},
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
