export interface DeveloperProfile {
  id: string;
  name: string;
  headline: string;
  location: string | null;
  avatarUrl: string;
  githubLogin: string;
  availableForOpportunities: boolean;
  overallScore: number;
  percentileRank: number;
  about: string | null;
}

export type SkillCategory =
  | "Backend"
  | "Frontend"
  | "Database"
  | "DevOps"
  | "Cloud"
  | "Problem Solving"
  | "Communication"
  | "Leadership";

export type SkillFingerprint = Record<SkillCategory, number>;

export interface RepoQualitySignals {
  hasTests: boolean;
  hasReadme: boolean;
  hasCi: boolean;
  hasLicense: boolean;
}

export interface DeveloperProject {
  id: string;
  name: string;
  description: string | null;
  languages: string[];
  stars: number;
  watchers: number;
  updatedAt: string;
  url: string;
  quality: RepoQualitySignals;
  category: "Featured" | "Personal" | "Collaboration";
}

export interface LanguageBreakdownEntry {
  language: string;
  bytes: number;
  percentage: number;
}

export interface CommitActivityPoint {
  weekStart: string;
  commitCount: number;
}

export interface DeveloperActivitySummary {
  languageBreakdown: LanguageBreakdownEntry[];
  commitActivity: CommitActivityPoint[];
  totalPullRequests: number;
  mergedPullRequests: number;
  codeReviews: number;
  issuesOpened: number;
  issuesClosed: number;
  publicRepoCount: number;
  followers: number;
}

export interface AnalyticsSnapshot {
  profileViews: number;
  profileViewsChangePct: number;
  searchAppearances: number;
  searchAppearancesChangePct: number;
  connectionRequests: number;
  connectionRequestsChangePct: number;
  topCountries: { country: string; percentage: number }[];
}
