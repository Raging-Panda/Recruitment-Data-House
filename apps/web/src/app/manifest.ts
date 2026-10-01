import type { MetadataRoute } from "next";
import { colors } from "@ipskill/shared";

/**
 * Next.js serves this at /manifest.webmanifest and links it from <head>
 * automatically — no manual <link rel="manifest"> needed. Lets a phone
 * browser "Add to Home Screen" as a standalone, full-screen app instead of
 * just bookmarking a tab.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IPSkill — Unique Skills, Perfect Match.",
    short_name: "IPSkill",
    description: "The developer hub for verified, skill-validated tech candidates.",
    start_url: "/",
    display: "standalone",
    background_color: colors.background,
    theme_color: colors.primary,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
