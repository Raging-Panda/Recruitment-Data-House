import type { SkillFingerprint } from "@ipskill/shared";
import { sortedSkillEntries } from "@/lib/analysis";

/**
 * "AI-generated candidate summary" — deliberately rule-based rather than a
 * real LLM call, same reasoning as position-suggestions.ts: no API key
 * for an external model is configured in this environment, and a
 * deterministic generator is free, instant, and doesn't hallucinate a
 * fact about someone's career. Produces the same kind of skimmable
 * one-liner a recruiter would want ("Backend/Cloud developer, strong in
 * Go and Postgres, 92% overall score") from data already on a
 * DirectoryEntry — no extra reads needed for the Directory use case this
 * was originally asked for.
 */
export function generateCandidateSummary(
  displayName: string,
  overallScore: number,
  skillFingerprint: SkillFingerprint,
  topLanguages: string[]
): string {
  const topDomains = sortedSkillEntries(skillFingerprint).slice(0, 2);
  const domainPhrase = topDomains.map(([category]) => category).join("/");
  const tier = overallScore >= 85 ? "Strong" : overallScore >= 65 ? "Solid" : "Developing";

  const parts = [
    `${tier} ${domainPhrase} developer`,
    topLanguages.length ? `strong in ${topLanguages.slice(0, 2).join(" and ")}` : null,
    `${overallScore}% overall fingerprint score`,
  ].filter(Boolean);

  return `${displayName} — ${parts.join(", ")}.`;
}
