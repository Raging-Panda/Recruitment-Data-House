import type { MetadataRoute } from "next";
import { getPublicDirectoryEntries } from "@/lib/directory";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const entries = await getPublicDirectoryEntries().catch(() => []);

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/directory`, changeFrequency: "daily", priority: 0.8 },
    ...entries
      .filter((e) => e.handle)
      .map((e) => ({
        url: `${base}/u/${e.handle}`,
        lastModified: e.lastActiveAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
  ];
}
