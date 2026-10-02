import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/directory", "/u/"],
        // Private surfaces: the signed-in app, APIs, and the unguessable
        // expiring share links (/p/[token]) must never be indexed.
        disallow: ["/dashboard", "/api/", "/p/", "/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
