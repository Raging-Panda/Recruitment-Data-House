import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

const SENSITIVE_HEADERS = ["cookie", "authorization", "set-cookie", "x-forwarded-for", "x-real-ip"];

/** OAuth callbacks carry `code` and `state` in the query string, and other
 * URLs may carry tokens — keep the path (what's useful for debugging),
 * drop everything after `?`. */
function stripQuery(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

/** Error messages are free text — a thrown Error can easily interpolate a
 * token, code or password. Blank the value of anything that looks like
 * secret=value / token: value, and long bearer-style strings. */
const SECRET_PAIR = /\b(password|passwd|pwd|secret|token|api[_-]?key|code|state|authorization)\b(\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s,;&]+)/gi;
function scrubText(text: string): string {
  return text.replace(SECRET_PAIR, "$1$2[Filtered]").replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [Filtered]");
}

/**
 * Runs on every event before it leaves the process. Errors are for
 * debugging the app, not for collecting people's data: no cookies (the
 * session JWT lives there), no auth headers, no IPs, no request bodies
 * (login/registration forms hold passwords), and no query strings.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripQuery(event.request.url);
    if (event.request.headers) {
      for (const name of Object.keys(event.request.headers)) {
        if (SENSITIVE_HEADERS.includes(name.toLowerCase())) delete event.request.headers[name];
      }
    }
  }
  if (event.user) {
    delete event.user.ip_address;
    delete event.user.email;
    delete event.user.username;
  }
  if (event.message) event.message = scrubText(event.message);
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = scrubText(ex.value);
  }
  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = scrubText(crumb.message);
    scrubBreadcrumb(crumb);
  }
  return event;
}

export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  const data = crumb.data as Record<string, unknown> | undefined;
  if (data) {
    for (const key of ["url", "to", "from"]) {
      if (typeof data[key] === "string") data[key] = stripQuery(data[key] as string);
    }
  }
  return crumb;
}
