import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { LOCAL_ID_PREFIX } from "@/lib/local-account";
import { verifyTotpOrBackupCode } from "@/lib/two-factor";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!session.githubId.startsWith(LOCAL_ID_PREFIX)) {
    return NextResponse.json({ error: "Not applicable to this account." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const userId = session.githubId.slice(LOCAL_ID_PREFIX.length);

  const valid = await verifyTotpOrBackupCode(userId, code);
  if (!valid) {
    return NextResponse.json({ error: "Enter a current code from your authenticator app (or a backup code) to disable." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("users")
    .update({ totp_secret: null, totp_enabled: false, totp_backup_codes: null })
    .eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
