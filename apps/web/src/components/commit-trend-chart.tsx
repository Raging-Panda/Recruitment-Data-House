"use client";

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { CommitActivityPoint } from "@ipskill/shared";
import { colors } from "@ipskill/shared";

export function CommitTrendChart({ commitActivity }: { commitActivity: CommitActivityPoint[] }) {
  const data = commitActivity.slice(-12).map((point) => ({
    week: new Date(point.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    commits: point.commitCount,
  }));

  if (data.length === 0) {
    return (
      <p className="mt-6 text-sm text-text-muted">
        No public commit activity in the last few months yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="week" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: colors.surface,
            border: `1px solid ${colors.surfaceBorder}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: colors.textSecondary }}
        />
        <Line
          type="monotone"
          dataKey="commits"
          stroke={colors.violet}
          strokeWidth={2}
          dot={{ r: 3, fill: colors.violet }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
