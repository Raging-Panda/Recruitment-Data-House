import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { LOCAL_ID_PREFIX } from "@/lib/local-account";
import { verifyTotp, generateBackupCodes } from "@/lib/two-factor";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!session.githubId.startsWith(LOCAL_ID_PREFIX)) {
    return NextResponse.json(
      { error: "Two-factor authentication only applies to email/password accounts." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const secret = typeof body?.secret === "string" ? body.secret : "";
  const code = typeof body?.code === "string" ? body.code : "";
  if (!secret || !verifyTotp(secret, code)) {
    return NextResponse.json({ error: "That code doesn't match — check the time on your device and try again." }, { status: 400 });
  }

  const userId = session.githubId.slice(LOCAL_ID_PREFIX.length);
  const { plain, hashed } = generateBackupCodes();

  const { error } = await getSupabaseAdmin()
    .from("users")
    .update({ totp_secret: secret, totp_enabled: true, totp_backup_codes: hashed })
    .eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, backupCodes: plain });
}
