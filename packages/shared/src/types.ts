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
  /** Most recent `updated_at` among repos containing this language — a
   * repo-level proxy for "when was this skill last used" (GitHub doesn't
   * expose per-language commit dates cheaply). Null when unknown. */
  lastUsedAt: string | null;
}

export interface CommitActivityPoint {
  weekStart: string;
  commitCount: number;
}

/** One day of GitHub's contribution calendar (commits, PRs, issues, reviews
 * — whatever GitHub itself counts), sourced via the GraphQL API since the
 * REST events endpoint doesn't expose this. */
export interface ContributionDay {
  date: string;
  count: number;
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

/** Nine-tier difficulty ladder. Existing single-tier templates (predating
 * this scaffold) have `level: null` and sit outside the ladder entirely. */
export type SkillTestLevel =
  | "beginner_1"
  | "beginner_2"
  | "beginner_3"
  | "intermediate_1"
  | "intermediate_2"
  | "intermediate_3"
  | "advanced_1"
  | "advanced_2"
  | "advanced_3";

export const SKILL_TEST_LEVEL_LABELS: Record<SkillTestLevel, string> = {
  beginner_1: "Beginner 1",
  beginner_2: "Beginner 2",
  beginner_3: "Beginner 3",
  intermediate_1: "Intermediate 1",
  intermediate_2: "Intermediate 2",
  intermediate_3: "Intermediate 3",
  advanced_1: "Advanced 1",
  advanced_2: "Advanced 2",
  advanced_3: "Advanced 3",
};

export interface SkillTestTemplate {
  id: string;
  slug: string;
  title: string;
  stack: string;
  description: string;
  timeLimitSeconds: number;
  questionCount: number;
  /** Null for the original single-tier "Fundamentals" templates. */
  level: SkillTestLevel | null;
  levelOrder: number | null;
  /** Content-authoring target for this tier — not enforced, questionCount is the real count. */
  targetQuestionCount: number | null;
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
  | "welcome"
  | "saved_search_match"
  | "endorsement_received";

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
  /** Snapshot of the candidate's own skill fingerprint, synced alongside
   * the rest of this row — powers the recruiter-side Compare view. */
  skillFingerprint: SkillFingerprint;
}

export interface ProfileViewStats {
  total: number;
  last30Days: number;
  changePct: number | null;
}

/** Mirrors the Directory browser's filter controls — shared so a saved
 * search can be matched against newly-synced candidates with the exact
 * same logic the browser uses to filter the live list. */
export interface DirectoryFilters {
  search: string;
  location: string;
  language: string;
  minScore: number;
  availableOnly: boolean;
}

export interface Shortlist {
  id: string;
  name: string;
  createdAt: string;
  candidateCount: number;
}

export interface ShortlistWithCandidates extends Shortlist {
  candidates: DirectoryEntry[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: DirectoryFilters;
  createdAt: string;
}

/** A peer endorsement of one skill category, with the endorser's display
 * info resolved from their own directory snapshot (best-effort — see
 * lib/endorsements.ts). "Verified" here means "another real signed-in
 * account", not ID-checked; a proper verification layer is still a
 * PLAN.md item. */
export interface Endorsement {
  id: string;
  endorserGithubId: string;
  endorserName: string;
  endorserAvatarUrl: string | null;
  skillCategory: SkillCategory;
  comment: string | null;
  createdAt: string;
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
