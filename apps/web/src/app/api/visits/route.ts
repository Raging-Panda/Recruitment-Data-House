import { NextRequest, NextResponse } from "next/server";
import { recordSiteVisit, type SiteVisitBeacon } from "@/lib/site-visits";

/** Receives the page-view beacon from components/site-visit-tracker.tsx.
 * Always answers 204: the browser never reads the reply, and a failed
 * insert shouldn't surface anywhere a visitor could see it. */
export async function POST(req: NextRequest) {
  let beacon: SiteVisitBeacon = {};
  try {
    beacon = JSON.parse(await req.text()) ?? {};
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await recordSiteVisit(req, beacon);
  } catch (err) {
    console.error("[visits] record failed", err);
  }
  return new NextResponse(null, { status: 204 });
}
