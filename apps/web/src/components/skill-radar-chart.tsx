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
import { colors } from "@ipskill/shared";

export function SkillRadarChart({ fingerprint }: { fingerprint: SkillFingerprint }) {
  const data = Object.entries(fingerprint).map(([category, value]) => ({
    category,
    value,
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} outerRadius="62%" margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
        <PolarGrid stroke={colors.surfaceBorder} />
        <PolarAngleAxis dataKey="category" tick={{ fill: colors.textSecondary, fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Skill Fingerprint"
          dataKey="value"
          stroke={colors.violet}
          fill={colors.purple}
          fillOpacity={0.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
