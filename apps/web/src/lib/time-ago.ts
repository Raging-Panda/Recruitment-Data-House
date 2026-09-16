/** Shared with the dashboard's ProfileNarrativeEditor, which is where this
 * phrasing ("Updated N days ago") originates — extracted here so every
 * place the "Currently" line is now surfaced (public profile, share link,
 * recruiter detail) reads consistently rather than re-deriving its own
 * format. */
export function relativeDate(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}
