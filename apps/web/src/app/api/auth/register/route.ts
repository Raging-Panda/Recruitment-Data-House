import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/password";
import { attributeReferral } from "@/lib/referrals";
import { LOCAL_ID_PREFIX } from "@/lib/local-account";
import { clientIp, hitRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { afterResponse } from "@/lib/after-response";
import { isEmailLoginEnabled } from "@/lib/email-login";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const DUPLICATE_EMAIL = "An account with that email already exists";

/** The login card shows `error` verbatim, so a database failure gets a
 * generic message; the real one goes to the server log (and Sentry, which
 * captures server console errors) instead of e.g. "TypeError: fetch failed". */
function accountCreationFailed(stage: string, err: { message: string }) {
  console.error(`[register] ${stage} failed:`, err.message);
  return NextResponse.json(
    { error: "We couldn't create your account right now. Please try again in a moment." },
    { status: 500 }
  );
}

/**
 * Creates a real, regular (email/password) account in `users`. Does not
 * sign the caller in itself — the client calls signIn("credentials", ...)
 * right after a 201, same two-step shape NextAuth's own examples use.
 */
export async function POST(req: NextRequest) {
  if (!isEmailLoginEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Signup is free to call, so without a cap it is a spam/enumeration
  // tool (the 409 below confirms which emails already have accounts).
  const limit = await hitRateLimit(`register:ip:${clientIp(req.headers)}`, RATE_LIMITS.registerPerIp);
  if (limit.limited) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) return accountCreationFailed("lookup", lookupError);
  if (existing) {
    return NextResponse.json({ error: DUPLICATE_EMAIL }, { status: 409 });
  }

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: hashPassword(password),
      display_name: displayName || null,
    })
    .select("id")
    .single();
  if (insertError) {
    // 23505 = unique violation: the same email signed up between the lookup
    // above and this insert.
    if (insertError.code === "23505") {
      return NextResponse.json({ error: DUPLICATE_EMAIL }, { status: 409 });
    }
    return accountCreationFailed("insert", insertError);
  }

  const ref = typeof body?.ref === "string" ? body.ref.trim() : "";
  if (ref) afterResponse(attributeReferral(ref, `${LOCAL_ID_PREFIX}${created.id}`));

  return NextResponse.json({ success: true }, { status: 201 });
}
