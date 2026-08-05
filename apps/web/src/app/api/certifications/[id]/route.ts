import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToCertification } from "@/lib/certifications";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { name, issuer, issueDate, expiryDate, credentialId, credentialUrl, description } =
    body ?? {};

  const { data, error } = await getSupabaseAdmin()
    .from("certifications")
    .update({
      ...(name !== undefined && { name }),
      ...(issuer !== undefined && { issuer }),
      ...(issueDate !== undefined && { issue_date: issueDate }),
      ...(expiryDate !== undefined && { expiry_date: expiryDate }),
      ...(credentialId !== undefined && { credential_id: credentialId }),
      ...(credentialUrl !== undefined && { credential_url: credentialUrl }),
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

  return NextResponse.json({ entry: rowToCertification(data) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await getSupabaseAdmin()
    .from("certifications")
    .delete()
    .eq("id", params.id)
    .eq("github_id", session.githubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
