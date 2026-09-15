import { ImageResponse } from "next/og";
import { getDirectoryEntryByHandle } from "@/lib/directory";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { handle: string } }) {
  const entry = await getDirectoryEntryByHandle(params.handle).catch(() => null);

  const displayName = entry?.displayName ?? "Developer";
  const headline = entry?.headline ?? "IPSkill profile";
  const score = entry?.overallScore ?? 0;
  const languages = entry?.topLanguages.slice(0, 3) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#05080F",
          color: "#F5F5FA",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 800 }}>
          IPSkill
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 64, fontWeight: 800 }}>{displayName}</div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 32, color: "#9797B5" }}>{headline}</div>
        <div style={{ display: "flex", marginTop: 40, alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              borderRadius: 60,
              border: "6px solid #5A18D6",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            {score}%
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {languages.map((lang) => (
              <div
                key={lang}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "#111A2E",
                  fontSize: 24,
                }}
              >
                {lang}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
