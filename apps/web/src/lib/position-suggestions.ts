import type {
  SkillFingerprint,
  DeveloperProject,
  WorkExperience,
  LanguageBreakdownEntry,
} from "@ipskill/shared";

export type Seniority = "Junior" | "Mid-Level" | "Senior" | "Staff/Lead";

export interface PositionSuggestion {
  title: string;
  domain: string;
  stackTag: string;
  seniority: Seniority;
  matchScore: number;
  rationale: string[];
}

export interface NextPositionSuggestions {
  primary: PositionSuggestion;
  alternates: PositionSuggestion[];
}

const DOMAIN_BASE_TITLES: Record<string, string> = {
  Backend: "Backend Engineer",
  Frontend: "Frontend Engineer",
  Database: "Database Engineer",
  DevOps: "DevOps Engineer",
  Cloud: "Cloud Engineer",
  "Full-Stack": "Full-Stack Engineer",
};

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function yearsOfExperience(entries: WorkExperience[]): number {
  if (entries.length === 0) return 0;
  const now = Date.now();
  const totalMs = entries.reduce((sum, entry) => {
    const start = new Date(entry.startDate).getTime();
    const end = entry.isCurrent || !entry.endDate ? now : new Date(entry.endDate).getTime();
    return sum + Math.max(0, end - start);
  }, 0);
  return totalMs / YEAR_MS;
}

/** Average fraction of {tests, CI, README, license} present across a candidate's
 * repos — a proxy for engineering maturity that doesn't depend on self-reported
 * work history, since not every candidate fills that in. */
function projectQualityRatio(projects: DeveloperProject[]): number {
  if (projects.length === 0) return 0;
  const scores = projects.map((p) => {
    const { hasTests, hasCi, hasReadme, hasLicense } = p.quality;
    return [hasTests, hasCi, hasReadme, hasLicense].filter(Boolean).length / 4;
  });
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

function resolveSeniority(years: number, overallScore: number, qualityRatio: number): Seniority {
  // With recorded work history, weight it heavily (years * 14 caps ~7yrs at 100);
  // without it, fall back to GitHub-derived signals only.
  const blended =
    years > 0
      ? Math.min(100, years * 14) * 0.6 + overallScore * 0.3 + qualityRatio * 100 * 0.1
      : overallScore * 0.85 + qualityRatio * 100 * 0.15;

  if (blended >= 82) return "Staff/Lead";
  if (blended >= 65) return "Senior";
  if (blended >= 40) return "Mid-Level";
  return "Junior";
}

function titleFor(seniority: Seniority, baseTitle: string): string {
  switch (seniority) {
    case "Junior":
      return `Junior ${baseTitle}`;
    case "Senior":
      return `Senior ${baseTitle}`;
    case "Staff/Lead":
      return `Staff ${baseTitle}`;
    default:
      return baseTitle;
  }
}

function topStackTag(breakdown: LanguageBreakdownEntry[], count = 2): string {
  const top = breakdown.slice(0, count).map((l) => l.language);
  return top.length > 0 ? top.join("/") : "General";
}

/**
 * Deterministic, explainable position matcher — no AI call, no external
 * dependency. Every input is data we already have (skill fingerprint,
 * language mix, project quality signals, recorded work history), which
 * means the result is reproducible and the rationale can cite exactly
 * which numbers drove it, rather than an opaque model output.
 */
export function suggestNextPositions(input: {
  skillFingerprint: SkillFingerprint;
  languageBreakdown: LanguageBreakdownEntry[];
  projects: DeveloperProject[];
  workExperience: WorkExperience[];
  overallScore: number;
}): NextPositionSuggestions {
  const { skillFingerprint, languageBreakdown, projects, workExperience, overallScore } = input;

  const years = yearsOfExperience(workExperience);
  const quality = projectQualityRatio(projects);
  const stackTag = topStackTag(languageBreakdown);
  const seniority = resolveSeniority(years, overallScore, quality);

  const domainScores: { domain: string; score: number }[] = [
    { domain: "Backend", score: skillFingerprint.Backend },
    { domain: "Frontend", score: skillFingerprint.Frontend },
    { domain: "Database", score: skillFingerprint.Database },
    { domain: "DevOps", score: skillFingerprint.DevOps },
    { domain: "Cloud", score: skillFingerprint.Cloud },
  ];

  // Full-stack is its own candidate domain, only eligible when backend and
  // frontend are both genuinely strong and close together — otherwise the
  // stronger single domain should win outright.
  const { Backend: backend, Frontend: frontend } = skillFingerprint;
  if (backend >= 55 && frontend >= 55 && Math.abs(backend - frontend) <= 15) {
    domainScores.push({ domain: "Full-Stack", score: (backend + frontend) / 2 + 3 });
  }

  domainScores.sort((a, b) => b.score - a.score);

  function buildSuggestion(domain: string, score: number): PositionSuggestion {
    const baseTitle = DOMAIN_BASE_TITLES[domain] ?? `${domain} Engineer`;
    const rationale: string[] = [
      `${domain === "Full-Stack" ? "Backend & Frontend" : domain} proficiency: ${Math.round(score)}%`,
    ];
    rationale.push(
      years > 0
        ? `${years.toFixed(1)} years of recorded work experience`
        : "Seniority estimated from GitHub activity — add work experience for a more precise read"
    );
    if (quality > 0) {
      rationale.push(
        `${Math.round(quality * 100)}% average project-quality score (tests, CI, docs) across ${projects.length} repo${projects.length === 1 ? "" : "s"}`
      );
    }

    return {
      title: titleFor(seniority, baseTitle),
      domain,
      stackTag,
      seniority,
      matchScore: Math.round(score),
      rationale,
    };
  }

  const [top, second] = domainScores;
  const primary = buildSuggestion(top.domain, top.score);

  const alternates: PositionSuggestion[] = [];
  if (second && second.score >= 40) {
    alternates.push(buildSuggestion(second.domain, second.score));
  }

  // Leadership is a modifier, not a domain of its own — only surfaces as an
  // alternate when it's genuinely strong alongside a solid primary domain.
  if (skillFingerprint.Leadership >= 65 && top.score >= 60) {
    alternates.push({
      title: "Engineering Lead",
      domain: "Leadership",
      stackTag,
      seniority,
      matchScore: Math.round(skillFingerprint.Leadership),
      rationale: [
        `Leadership proficiency: ${Math.round(skillFingerprint.Leadership)}%`,
        `Paired with strong ${top.domain} skills (${Math.round(top.score)}%)`,
      ],
    });
  }

  return { primary, alternates: alternates.slice(0, 2) };
}
