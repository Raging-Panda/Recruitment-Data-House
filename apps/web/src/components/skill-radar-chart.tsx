"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { SkillFingerprint } from "@ipskill/shared";

export function SkillRadarChart({ fingerprint }: { fingerprint: SkillFingerprint }) {
  const data = Object.entries(fingerprint).map(([category, value]) => ({
    category,
    value,
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="#2A2A4A" />
        <PolarAngleAxis dataKey="category" tick={{ fill: "#9797B5", fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Skill Fingerprint"
          dataKey="value"
          stroke="#A855F7"
          fill="#7C3AED"
          fillOpacity={0.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
