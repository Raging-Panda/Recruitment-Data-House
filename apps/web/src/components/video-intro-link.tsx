import { isSafeHttpUrl } from "@/lib/url-validation";

/**
 * The candidate's async video intro — a pasted Loom/YouTube/etc. link from
 * the Public Identity card (no uploads). The save route already restricts it
 * to http(s); re-checked here so a value stored before that check existed
 * can't render as a javascript: link.
 */
export function VideoIntroLink({ url }: { url: string | null }) {
  if (!url || !isSafeHttpUrl(url)) return null;
  return (
    <p className="mt-2 text-xs">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:underline"
      >
        ▶ Watch video intro
      </a>
    </p>
  );
}
