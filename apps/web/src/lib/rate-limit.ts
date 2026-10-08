import "server-only";
import { createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface RateLimitRule {
  /** Attempts allowed inside the window; the (limit + 1)th is refused. */
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  limited: boolean;
  retryAfterSeconds: number;
}

// Per-instance backstop. Serverless instances don't share memory, so this
// alone is weak — but it means a burst against one instance is still
// stopped, and protection doesn't vanish if the rate_limit_events table
// is missing or Supabase is down (the DB layer fails open, never closed:
// a limiter outage must not lock every user out of signing in).
const memory = new Map<string, number[]>();

function recordInMemory(key: string, windowMs: number, now: number): number[] {
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  memory.set(key, recent);
  if (memory.size > 5000) {
    for (const [k, ts] of memory) {
      if (ts.every((t) => now - t >= windowMs)) memory.delete(k);
    }
  }
  return recent;
}

/**
 * Records one attempt for `key`, then reports whether the caller is over
 * the limit. Insert-then-count (rather than check-then-insert) so a burst
 * of parallel requests can't all slip under the limit before any of them
 * is counted — the worst case is being slightly strict, never lax.
 */
export async function hitRateLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const mem = recordInMemory(key, windowMs, now);
  let count = mem.length;

  try {
    const supabase = getSupabaseAdmin();
    const since = new Date(now - windowMs).toISOString();
    const { error: insertError } = await supabase.from("rate_limit_events").insert({ key });
    if (!insertError) {
      const { count: dbCount, error: countError } = await supabase
        .from("rate_limit_events")
        .select("key", { count: "exact", head: true })
        .eq("key", key)
        .gte("created_at", since);
      if (!countError && typeof dbCount === "number") count = Math.max(count, dbCount);
      if (Math.random() < 0.02) {
        void Promise.resolve(
          supabase
            .from("rate_limit_events")
            .delete()
            .lt("created_at", new Date(now - 86_400_000).toISOString())
        ).catch(() => undefined);
      }
    }
  } catch {
    // fail open on the shared store; the in-memory count above still applies
  }

  if (count <= rule.limit) return { limited: false, retryAfterSeconds: 0 };
  const oldest = mem[0] ?? now;
  return {
    limited: true,
    retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
  };
}

/** Clears a bucket — used after a successful sign-in so a user who typo'd
 * a few times isn't left locked out for the rest of the window. */
export async function resetRateLimit(key: string): Promise<void> {
  memory.delete(key);
  try {
    await getSupabaseAdmin().from("rate_limit_events").delete().eq("key", key);
  } catch {
    // best effort
  }
}

type HeaderBag = Headers | Record<string, string | string[] | undefined>;

function readHeader(headers: HeaderBag, name: string): string | undefined {
  if (typeof (headers as Headers).get === "function") return (headers as Headers).get(name) ?? undefined;
  const v = (headers as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(v) ? v[0] : v;
}

/** Best-effort client IP. On Vercel the platform sets x-forwarded-for, so
 * the first hop is the real client; elsewhere it can be spoofed, which is
 * why every IP rule is paired with a per-account rule that doesn't trust it. */
export function clientIp(headers: HeaderBag): string {
  const forwarded = readHeader(headers, "x-vercel-forwarded-for") ?? readHeader(headers, "x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || readHeader(headers, "x-real-ip") || "unknown";
}

/** Short stable hash so emails never land in the table in the clear. */
export function hashKeyPart(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export const RATE_LIMITS = {
  loginPerEmail: { limit: 10, windowSeconds: 15 * 60 },
  loginPerIp: { limit: 30, windowSeconds: 15 * 60 },
  // A 6-digit code has 1,000,000 values; 6 tries per 15 minutes makes
  // guessing one hopeless while leaving real users room for typos.
  totpPerUser: { limit: 6, windowSeconds: 15 * 60 },
  registerPerIp: { limit: 5, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;
