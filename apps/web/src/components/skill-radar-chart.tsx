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
import { themeColor } from "@/lib/theme-colors";

export function SkillRadarChart({ fingerprint }: { fingerprint: SkillFingerprint }) {
  const data = Object.entries(fingerprint).map(([category, value]) => ({
    category,
    value,
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} outerRadius="55%" margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
        <PolarGrid stroke={themeColor.surfaceBorder} />
        <PolarAngleAxis dataKey="category" tick={{ fill: themeColor.textSecondary, fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Skill Fingerprint"
          dataKey="value"
          stroke={colors.violet}
          fill={colors.purple}
          fillOpacity={0.5}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
