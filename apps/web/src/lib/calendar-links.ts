/**
 * Pure string-building, no OAuth or external API — Google Calendar and
 * Outlook both support a pre-filled "add event" link format that needs
 * nothing but a URL. This is deliberately the "booking link" version of
 * calendar sync, not the "read someone's real free/busy time" version —
 * that needs its own Calendar-scoped OAuth app per provider, parked in
 * improvements.md until it's actually wanted.
 */

function toGoogleDate(iso: string): string {
  // YYYYMMDDTHHMMSSZ — Google's compact UTC format, no dashes/colons.
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarLink(params: {
  title: string;
  startIso: string;
  durationMinutes: number;
  details?: string;
}): string {
  const start = new Date(params.startIso);
  const end = new Date(start.getTime() + params.durationMinutes * 60_000);
  const search = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${toGoogleDate(start.toISOString())}/${toGoogleDate(end.toISOString())}`,
    details: params.details ?? "",
  });
  return `https://calendar.google.com/calendar/render?${search.toString()}`;
}

export function buildOutlookCalendarLink(params: {
  title: string;
  startIso: string;
  durationMinutes: number;
  details?: string;
}): string {
  const start = new Date(params.startIso);
  const end = new Date(start.getTime() + params.durationMinutes * 60_000);
  const search = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: params.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: params.details ?? "",
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${search.toString()}`;
}

/** A universal fallback (Apple Calendar, Thunderbird, anything else) —
 * the standard .ics text format, served as a download by the /ics route. */
export function buildIcsContent(params: {
  title: string;
  startIso: string;
  durationMinutes: number;
  details?: string;
  uid: string;
}): string {
  const start = new Date(params.startIso);
  const end = new Date(start.getTime() + params.durationMinutes * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const escapeText = (s: string) => s.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IPSkill//Interview Scheduling//EN",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(params.title)}`,
    params.details ? `DESCRIPTION:${escapeText(params.details)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter((line): line is string => line !== null)
    .join("\r\n");
}
