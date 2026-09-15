import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyPassword } from "@/lib/password";

/**
 * Pre-checks email+password *without* signing in, purely so the login
 * form knows whether to prompt for a second factor before it ever calls
 * next-auth's credentials signIn. The actual sign-in still independently
 * re-verifies both the password and the TOTP/backup code inside
 * `authorize()` (lib/auth.ts) — this route is a UX hint, not a trust
 * boundary, so a forged "requires2FA: false" response can't skip the
 * real check.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ ok: false });

  const { data: user } = await getSupabaseAdmin()
    .from("users")
    .select("password_hash, totp_enabled")
    .eq("email", email)
    .maybeSingle();

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({ ok: true, requires2FA: Boolean(user.totp_enabled) });
}
