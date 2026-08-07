"use client";

import { useEffect, useRef, useState } from "react";
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

const STAGGER_MS = 100; // delay between each point starting its extension
const POINT_DURATION_MS = 700; // how long each individual point takes to extend

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function SkillRadarChart({ fingerprint }: { fingerprint: SkillFingerprint }) {
  const points = Object.entries(fingerprint).map(([category, value]) => ({ category, value }));
  const [data, setData] = useState(() => points.map((p) => ({ ...p, value: 0 })));
  const frameRef = useRef<number>();

  useEffect(() => {
    const totalDuration = (points.length - 1) * STAGGER_MS + POINT_DURATION_MS;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      setData(
        points.map((point, i) => {
          const localElapsed = elapsed - i * STAGGER_MS;
          if (localElapsed <= 0) return { ...point, value: 0 };
          if (localElapsed >= POINT_DURATION_MS) return point;
          return { ...point, value: point.value * easeOutCubic(localElapsed / POINT_DURATION_MS) };
        })
      );
      if (elapsed < totalDuration) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [fingerprint]);

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
          isAnimationActive={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
