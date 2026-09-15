import type { MetadataRoute } from "next";
import { getPublicDirectoryEntries } from "@/lib/directory";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
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
