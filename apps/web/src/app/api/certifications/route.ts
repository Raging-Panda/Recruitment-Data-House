import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToCertification } from "@/lib/certifications";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("certifications")
    .select("*")
    .eq("github_id", session.githubId)
    .order("issue_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data.map(rowToCertification) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json();
  const { name, issuer, issueDate, expiryDate, credentialId, credentialUrl, description } =
    body ?? {};

  if (!name || !issuer || !issueDate) {
    return NextResponse.json(
      { error: "name, issuer, and issueDate are required" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("certifications")
    .insert({
      github_id: session.githubId,
      name,
      issuer,
      issue_date: issueDate,
      expiry_date: expiryDate ?? null,
      credential_id: credentialId ?? null,
      credential_url: credentialUrl ?? null,
      description: description ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: rowToCertification(data) }, { status: 201 });
}
