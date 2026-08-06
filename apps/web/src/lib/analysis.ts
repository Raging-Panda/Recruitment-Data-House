import type { SkillCategory, SkillFingerprint, CommitActivityPoint } from "@ipskill/shared";

const STRONG_THRESHOLD = 60;

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
