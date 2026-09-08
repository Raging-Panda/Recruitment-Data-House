import type { SkillCategory, SkillFingerprint, CommitActivityPoint } from "@ipskill/shared";

const STRONG_THRESHOLD = 60;
const STALE_THRESHOLD_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SkillFreshness {
  label: string;
  isStale: boolean;
}

/**
 * "Last used" is a repo-level proxy (see buildLanguageBreakdown's
 * lastUsedAt), not a per-commit language date — GitHub doesn't expose that
 * cheaply. Anything older than a year is flagged so the fingerprint reads
 * as current ability, not just historical totals.
 */
export function describeSkillFreshness(lastUsedAt: string | null): SkillFreshness | null {
  if (!lastUsedAt) return null;
  const daysSince = Math.floor((Date.now() - new Date(lastUsedAt).getTime()) / DAY_MS);
  const isStale = daysSince >= STALE_THRESHOLD_DAYS;

  if (daysSince < 30) return { label: "Used this month", isStale: false };
  if (!isStale) {
    const months = Math.round(daysSince / 30);
    return { label: `Last used ${months} month${months === 1 ? "" : "s"} ago`, isStale: false };
  }
  const years = Math.floor(daysSince / 365);
  const year = new Date(lastUsedAt).getFullYear();
  return {
    label: years >= 1 ? `Last used ${year} — ${years} yr${years === 1 ? "" : "s"} ago` : `Last used ${year}`,
    isStale: true,
  };
}

export function sortedSkillEntries(fingerprint: SkillFingerprint): [SkillCategory, number][] {
  return (Object.entries(fingerprint) as [SkillCategory, number][]).sort((a, b) => b[1] - a[1]);
}

export function splitStrengthsAndGaps(fingerprint: SkillFingerprint) {
  const entries = sortedSkillEntries(fingerprint);
  return {
    strengths: entries.filter(([, score]) => score >= STRONG_THRESHOLD),
    improvementAreas: entries
      .filter(([, score]) => score < STRONG_THRESHOLD)
      .sort((a, b) => a[1] - b[1]),
  };
}

/**
 * % change in commit volume over the last 4 weeks vs the 4 weeks before
 * that — a real signal from GitHub's own event history, not a fabricated
 * trend line (we don't snapshot historical scores yet).
 */
export function computeLearningMomentum(commitActivity: CommitActivityPoint[]): number {
  if (commitActivity.length === 0) return 0;
  const recent = commitActivity.slice(-4);
  const prior = commitActivity.slice(-8, -4);
  const sum = (points: CommitActivityPoint[]) =>
    points.reduce((total, point) => total + point.commitCount, 0);
  const recentTotal = sum(recent);
  const priorTotal = sum(prior);
  if (priorTotal === 0) return recentTotal > 0 ? 100 : 0;
  return Math.round(((recentTotal - priorTotal) / priorTotal) * 100);
}
