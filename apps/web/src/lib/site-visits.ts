import "server-only";
import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { afterResponse } from "@/lib/after-response";
import { clientIp } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Cookieless website traffic counting, written to site_visits (see
 * db/migrations/0017_site_visits.sql). The browser side is
 * components/site-visit-tracker.tsx, which posts one beacon per page shown.
 *
 * Only production records, so local dev and Vercel previews (which also
 * build with NODE_ENV=production) don't pollute the numbers. Set
 * RECORD_SITE_VISITS=true to record from anywhere else, e.g. to test.
 */
export function siteVisitsEnabled(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.RECORD_SITE_VISITS === "true";
}

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|whatsapp|vercel/i;

// Dynamic segments that would otherwise store a secret (share-link tokens),
// a person (profile handles, GitHub ids) or noise (message ids) per row.
const PATH_PLACEHOLDERS: Array<[RegExp, string]> = [
  [/^\/p\/[^/]+/, "/p/[token]"],
  [/^\/u\/[^/]+/, "/u/[handle]"],
  [/^\/dashboard\/messages\/[^/]+/, "/dashboard/messages/[id]"],
  [/^\/dashboard\/recruiter\/shortlists\/[^/]+/, "/dashboard/recruiter/shortlists/[id]"],
  [/^\/dashboard\/recruiter\/directory\/[^/]+/, "/dashboard/recruiter/directory/[githubId]"],
];

// Backstop for routes added later: any segment that looks like an id or a
// token (a uuid, a long number, a long mixed-case random string) becomes
// [id]. Lowercase slugs such as a skill test's stay readable.
const ID_LIKE = /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F-]{27}|\d{6,}|(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[A-Za-z0-9_-]{20,})$/;

export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.length > 300) return null;
  let path = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path.startsWith("/api/")) return null;
  for (const [pattern, placeholder] of PATH_PLACEHOLDERS) {
    if (pattern.test(path)) {
      path = path.replace(pattern, placeholder);
      break;
    }
  }
  return path
    .split("/")
    .map((segment) => (ID_LIKE.test(segment) ? "[id]" : segment))
    .join("/");
}

/** The referring site's host name only — a full referrer URL can carry a
 * search query or someone's profile path. Visits from our own pages are
 * internal, not a source, so they come back as null. */
function referrerHost(raw: unknown, ownHost: string | null): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host === ownHost) return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

function utmValue(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase().slice(0, 100);
  return /^[\w .:/+-]+$/.test(value) ? value : null;
}

function deviceType(req: NextRequest, ua: string): "desktop" | "mobile" | "tablet" {
  if (/ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(ua)) return "tablet";
  if (req.headers.get("sec-ch-ua-mobile") === "?1" || /mobi|iphone|ipod|android|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

/** Changes every UTC day, so a visitor can be counted once per day but
 * never followed from one day to the next or traced back to an IP. */
function visitorHash(secret: string, ip: string, ua: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret).update(`site-visit|${day}|${ip}|${ua}`).digest("hex").slice(0, 16);
}

function ownHostName(req: NextRequest): string | null {
  const host = req.headers.get("host") ?? new URL(getSiteUrl()).host;
  return host.split(":")[0].toLowerCase().replace(/^www\./, "") || null;
}

// Per-instance flood guard. A real reader shows a few pages a minute; this
// only stops one client hammering the endpoint into the table.
const recentHits = new Map<string, number[]>();
const FLOOD_LIMIT = 60;
const FLOOD_WINDOW_MS = 60_000;

function flooding(key: string, now: number): boolean {
  const recent = (recentHits.get(key) ?? []).filter((t) => now - t < FLOOD_WINDOW_MS);
  recent.push(now);
  recentHits.set(key, recent);
  if (recentHits.size > 5000) {
    for (const [k, ts] of recentHits) {
      if (ts.every((t) => now - t >= FLOOD_WINDOW_MS)) recentHits.delete(k);
    }
  }
  return recent.length > FLOOD_LIMIT;
}

const RETENTION_MS = 395 * 86_400_000;

export interface SiteVisitBeacon {
  path?: unknown;
  referrer?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
}

/**
 * Records one page shown. Skips bots, browsers sending Do Not Track or
 * Global Privacy Control, malformed paths and floods; never throws for any
 * of those, since the beacon has nobody to report an error to.
 */
export async function recordSiteVisit(req: NextRequest, beacon: SiteVisitBeacon): Promise<void> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!siteVisitsEnabled() || !secret) return;
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") return;

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return;

  const path = normalizePath(beacon.path);
  if (!path) return;

  const hash = visitorHash(secret, clientIp(req.headers), ua);
  const now = Date.now();
  if (flooding(hash, now)) return;

  const country = req.headers.get("x-vercel-ip-country");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("site_visits").insert({
    path,
    referrer_host: referrerHost(beacon.referrer, ownHostName(req)),
    utm_source: utmValue(beacon.utmSource),
    utm_medium: utmValue(beacon.utmMedium),
    utm_campaign: utmValue(beacon.utmCampaign),
    visitor_hash: hash,
    device: deviceType(req, ua),
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    signed_in: req.cookies.has("__Secure-next-auth.session-token") || req.cookies.has("next-auth.session-token"),
  });
  if (error) throw new Error(error.message);

  if (Math.random() < 0.01) {
    afterResponse(
      Promise.resolve(
        supabase.from("site_visits").delete().lt("visited_at", new Date(now - RETENTION_MS).toISOString())
      )
    );
  }
}
