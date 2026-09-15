import { NextRequest, NextResponse } from "next/server";
import { getDirectoryEntryByHandle } from "@/lib/directory";

/**
 * Embeddable SVG badge for a public handle — e.g.
 * ![IPSkill](https://ipskill.com/api/badge/alice.svg) in a GitHub README.
 * The classic Shields.io-style growth loop: every embed is a link back.
 * URL carries ".svg" as part of the [handle] segment (Next.js route
 * params don't natively support a literal file extension), stripped here.
 */
export async function GET(_req: NextRequest, { params }: { params: { handle: string } }) {
  const handle = params.handle.replace(/\.svg$/i, "");
  const entry = await getDirectoryEntryByHandle(handle).catch(() => null);

  const score = entry?.overallScore ?? 0;
  const label = entry ? entry.displayName : "IPSkill";
  const value = entry ? `${score}% · ${entry.topLanguages[0] ?? "developer"}` : "profile not found";
  const labelWidth = 60 + label.length * 6;
  const valueWidth = 20 + value.length * 6.5;
  const width = labelWidth + valueWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${width}" height="28" rx="6" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="28" fill="#05080F"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="28" fill="#5A18D6"/>
    <rect width="${width}" height="28" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="start" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="13">
    <text x="10" y="18">${label}</text>
    <text x="${labelWidth + 10}" y="18">${value}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
