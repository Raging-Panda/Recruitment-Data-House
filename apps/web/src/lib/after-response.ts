import { waitUntil } from "@vercel/functions";

/**
 * Runs side work (notifications, activity events, push sends, cache syncs)
 * without making the response wait for it. On Vercel a function can be
 * frozen as soon as it responds, so a bare `void promise` may never finish
 * there; waitUntil keeps the invocation alive until the promise settles. Off
 * Vercel (local dev, `next start`) there's no request context and the promise
 * simply runs, as before. Nothing awaits the task, so a rejection is logged
 * here — server console errors reach Sentry — instead of going unhandled.
 */
export function afterResponse(task: Promise<unknown>): void {
  waitUntil(task.catch((err) => console.error("[afterResponse]", err)));
}
