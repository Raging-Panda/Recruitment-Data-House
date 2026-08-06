import { colors } from "@ipskill/shared";
import { themeColor } from "@/lib/theme-colors";

export function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} stroke={themeColor.surfaceBorder} strokeWidth="8" fill="none" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          stroke={colors.purple}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="49" textAnchor="middle" fontSize="18" fontWeight={700} fill={themeColor.heading}>
          {score}%
        </text>
      </svg>
      <p className="mt-1 text-xs text-text-secondary">{label}</p>
    </div>
  );
}
