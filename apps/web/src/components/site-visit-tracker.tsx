"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends one beacon to /api/visits per page shown, including client-side
 * navigations, for the website traffic numbers (lib/site-visits.ts). Sets
 * no cookie and stores nothing in the browser. Only the first page of a
 * load reports document.referrer: after that, the referrer is still the
 * original site, which would count one arrival many times.
 *
 * Depends on the pathname alone, so filter or sort changes that only touch
 * the query string (e.g. on /directory) aren't counted as new pages.
 */
export function SiteVisitTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const isFirstPage = useRef(true);

  useEffect(() => {
    // The ref also absorbs React's dev-mode double effect run.
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;

    const params = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      path: pathname,
      referrer: isFirstPage.current ? document.referrer : "",
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    });
    isFirstPage.current = false;

    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/visits", blob)) {
      fetch("/api/visits", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
        () => undefined
      );
    }
  }, [pathname]);

  return null;
}
