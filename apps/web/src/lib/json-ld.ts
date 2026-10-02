import type { DirectoryEntry } from "@ipskill/shared";
import { getSiteUrl } from "@/lib/site-url";

/** schema.org Person for a public profile — what lets a search engine
 * connect a developer's name to their IPSkill page. Only fields the
 * developer already shows publicly on /u/[handle]. */
export function buildPersonJsonLd(entry: DirectoryEntry, handle: string) {
  const url = `${getSiteUrl()}/u/${handle}`;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: entry.displayName,
    url,
    ...(entry.headline ? { jobTitle: entry.headline } : {}),
    ...(entry.avatarUrl ? { image: entry.avatarUrl } : {}),
    ...(entry.about ? { description: entry.about.slice(0, 300) } : {}),
    ...(entry.company ? { worksFor: { "@type": "Organization", name: entry.company } } : {}),
    ...(entry.topLanguages.length > 0 ? { knowsAbout: entry.topLanguages } : {}),
    sameAs: [`https://github.com/${entry.githubLogin}`],
  };
}

/** JSON.stringify output is safe inside a <script> only once "<" is
 * escaped — otherwise a profile field containing "</script>" breaks out
 * of the tag (stored XSS via the public profile). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
