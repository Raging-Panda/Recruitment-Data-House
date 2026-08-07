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

export type RepoActivityEventType = "commit" | "pull_request" | "release";

export interface RepoActivityEvent {
  id: string;
  repoName: string;
  repoUrl: string;
  type: RepoActivityEventType;
  title: string;
  url: string;
  occurredAt: string;
  state?: "open" | "closed" | "merged";
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

export interface CandidateProfileOverride {
  githubId: string;
  displayName: string;
  updatedAt: string;
}

export interface WorkExperience {
  id: string;
  githubId: string;
  company: string;
  role: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WorkExperienceInput = Omit<
  WorkExperience,
  "id" | "githubId" | "createdAt" | "updatedAt"
>;

export interface Certification {
  id: string;
  githubId: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CertificationInput = Omit<
  Certification,
  "id" | "githubId" | "createdAt" | "updatedAt"
>;

export interface SkillTestTemplate {
  id: string;
  slug: string;
  title: string;
  stack: string;
  description: string;
  timeLimitSeconds: number;
  questionCount: number;
}

/** Deliberately has no correct-answer field — this is the shape served to candidates. */
export interface SkillTestQuestion {
  id: string;
  questionText: string;
  choices: string[];
}

export type SkillTestAttemptStatus = "in_progress" | "completed" | "expired";

export interface SkillTestAttempt {
  id: string;
  templateId: string;
  status: SkillTestAttemptStatus;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  startedAt: string;
  submittedAt: string | null;
}

/** One row per template, summarizing a candidate's best/latest attempt for the Skills page list. */
export interface SkillTestAttemptSummary {
  templateId: string;
  status: SkillTestAttemptStatus | "not_started";
  bestPercentage: number | null;
  latestAttemptId: string | null;
  completedAt: string | null;
}

export interface SkillTestStartResponse {
  attemptId: string;
  timeLimitSeconds: number;
  startedAt: string;
  questions: SkillTestQuestion[];
}

export interface SkillTestSubmitResult {
  attemptId: string;
  status: SkillTestAttemptStatus;
  score: number;
  maxScore: number;
  percentage: number;
}

export type NotificationType =
  | "experience_added"
  | "certification_added"
  | "skill_test_completed"
  | "welcome";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * A cached, self-reported-ish snapshot for the developer directory — not a
 * live GitHub fetch. There's no way to fetch another user's GitHub data on
 * their behalf (we only ever hold the signed-in user's own access token),
 * so directory entries are refreshed from a candidate's own profile data
 * whenever they visit it, and everyone else just reads the cached copy.
 */
export interface DirectoryEntry {
  githubId: string;
  githubLogin: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  location: string | null;
  overallScore: number;
  topLanguages: string[];
  availableForOpportunities: boolean;
  about: string | null;
  lastActiveAt: string;
}

export interface ProfileViewStats {
  total: number;
  last30Days: number;
  changePct: number | null;
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
