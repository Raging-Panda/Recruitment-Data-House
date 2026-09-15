import "server-only";
import { createHmac, randomBytes, randomInt } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/password";
import { LOCAL_ID_PREFIX } from "@/lib/local-account";

// Hand-rolled RFC 6238 TOTP (HMAC-SHA1, 30s step, 6 digits — the values
// every authenticator app assumes) using Node's built-in crypto, same
// "avoid a new dependency" call as lib/password.ts's scrypt use. No QR
// image library either — the setup UI shows the base32 secret as
// copy/paste "manual entry" text plus the otpauth:// URI, which every
// authenticator app accepts as an alternative to scanning a code.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder > 0) {
    const chunk = bits.slice(bits.length - remainder).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return output;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secretBuffer: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secretBuffer).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binCode % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function buildOtpauthUri(secretBase32: string, email: string): string {
  const label = encodeURIComponent(`IPSkill:${email}`);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=IPSkill&digits=${DIGITS}&period=${STEP_SECONDS}`;
}

/** Formats the secret in 4-char groups for easier manual entry — cosmetic
 * only, base32Decode strips whitespace before use either way. */
export function formatSecretForDisplay(secretBase32: string): string {
  return secretBase32.replace(/(.{4})/g, "$1 ").trim();
}

/** Accepts a ±1 step window (±30s) to tolerate clock drift between the
 * server and the authenticator app — the standard TOTP verification
 * tolerance. */
export function verifyTotp(secretBase32: string, code: string, at: number = Date.now()): boolean {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) return false;
  const secretBuffer = base32Decode(secretBase32);
  const counter = Math.floor(at / 1000 / STEP_SECONDS);
  for (const drift of [0, -1, 1]) {
    if (hotp(secretBuffer, counter + drift) === trimmed) return true;
  }
  return false;
}

export interface GeneratedBackupCodes {
  plain: string[];
  hashed: string[];
}

const BACKUP_CODE_COUNT = 8;

function randomBackupCode(): string {
  const part = () => randomInt(0, 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
  return `${part()}-${part()}`;
}

export function generateBackupCodes(): GeneratedBackupCodes {
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, randomBackupCode);
  return { plain, hashed: plain.map(hashPassword) };
}

function localUserId(githubId: string): string | null {
  return githubId.startsWith(LOCAL_ID_PREFIX) ? githubId.slice(LOCAL_ID_PREFIX.length) : null;
}

export interface TotpStatus {
  supported: boolean;
  enabled: boolean;
}

/** Only regular (email/password) accounts go through this app's own
 * credentials provider, so only they can meaningfully gain a second
 * factor here — a GitHub/Google/LinkedIn sign-in's MFA is the OAuth
 * provider's own responsibility. */
export async function getTotpStatus(githubId: string): Promise<TotpStatus> {
  const userId = localUserId(githubId);
  if (!userId) return { supported: false, enabled: false };
  const { data } = await getSupabaseAdmin()
    .from("users")
    .select("totp_enabled")
    .eq("id", userId)
    .maybeSingle();
  return { supported: true, enabled: Boolean(data?.totp_enabled) };
}

/** Tries the code against the account's live TOTP secret, then against its
 * unused backup codes. On a matching backup code, removes it from the
 * stored list (single-use) — a plain read-then-write, same non-atomic
 * tradeoff already accepted elsewhere in this app (share-link view
 * counts) for a low-contention per-user field. */
export async function verifyTotpOrBackupCode(userId: string, code: string): Promise<boolean> {
  const { data: user } = await getSupabaseAdmin()
    .from("users")
    .select("totp_secret, totp_backup_codes")
    .eq("id", userId)
    .maybeSingle();
  if (!user?.totp_secret) return false;

  if (verifyTotp(user.totp_secret, code)) return true;

  const backupCodes: string[] = user.totp_backup_codes ?? [];
  const trimmed = code.trim().toUpperCase();
  const matchIndex = backupCodes.findIndex((hashed) => verifyPassword(trimmed, hashed));
  if (matchIndex === -1) return false;

  const remaining = backupCodes.filter((_, i) => i !== matchIndex);
  await getSupabaseAdmin().from("users").update({ totp_backup_codes: remaining }).eq("id", userId);
  return true;
}
