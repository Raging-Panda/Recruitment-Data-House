import {
  deriveAnalyticsSnapshot,
  type RepoActivityEvent,
  type SkillTestAttemptSummary,
  type SkillTestTemplate,
} from "@ipskill/shared";
import type { DeveloperHubData } from "./developer-data";
import type {
  WorkExperience,
  Certification,
  CandidateProfileOverride,
  NotificationItem,
  DirectoryEntry,
} from "@ipskill/shared";
import { DEMO_GITHUB_ID } from "./demo-mode";

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

export const DEMO_DISPLAY_NAME = "Naledi Khumalo";

export const DEMO_PROFILE_OVERRIDE: CandidateProfileOverride = {
  githubId: DEMO_GITHUB_ID,
  displayName: DEMO_DISPLAY_NAME,
  updatedAt: new Date(NOW - 40 * DAY).toISOString(),
};

/**
 * Fixture data for the public "admin@admin.com" demo account — a fully
 * populated, presentable profile for showing the product to prospects
 * without needing a real GitHub login. Shaped exactly like the real
 * GitHub-derived data so every page renders as it would for a genuine
 * power user.
 */
export function buildDemoDeveloperHubData(): DeveloperHubData {
  const languageBreakdown = [
    { language: "Go", bytes: 480_000, percentage: 34 },
    { language: "TypeScript", bytes: 380_000, percentage: 27 },
    { language: "Python", bytes: 240_000, percentage: 17 },
    { language: "SQL", bytes: 140_000, percentage: 10 },
    { language: "Terraform", bytes: 90_000, percentage: 6 },
    { language: "CSS", bytes: 80_000, percentage: 6 },
  ];

  const commitActivity = Array.from({ length: 12 }, (_, i) => ({
    weekStart: new Date(NOW - (11 - i) * WEEK).toISOString().slice(0, 10),
    commitCount: [18, 22, 19, 25, 28, 24, 30, 27, 33, 31, 29, 35][i],
  }));

  const activity: DeveloperHubData["activity"] = {
    languageBreakdown,
    commitActivity,
    totalPullRequests: 156,
    mergedPullRequests: 142,
    codeReviews: 210,
    issuesOpened: 48,
    issuesClosed: 45,
    publicRepoCount: 34,
    followers: 312,
  };

  const skillFingerprint: DeveloperHubData["skillFingerprint"] = {
    Backend: 92,
    Frontend: 74,
    Database: 85,
    DevOps: 68,
    Cloud: 71,
    "Problem Solving": 88,
    Communication: 80,
    Leadership: 62,
  };

  const projects: DeveloperHubData["projects"] = [
    {
      id: "demo-1",
      name: "payments-gateway-core",
      description: "Idempotent transaction ledger and payment-orchestration service processing 2M+ transactions/day.",
      languages: ["Go", "SQL"],
      stars: 210,
      watchers: 38,
      updatedAt: new Date(NOW - 1 * DAY).toISOString(),
      url: "https://github.com/naledi-khumalo/payments-gateway-core",
      quality: { hasTests: true, hasReadme: true, hasCi: true, hasLicense: true },
      category: "Featured",
    },
    {
      id: "demo-2",
      name: "distributed-task-queue",
      description: "At-least-once distributed job queue with dead-letter handling, built for horizontal scale.",
      languages: ["Go"],
      stars: 96,
      watchers: 19,
      updatedAt: new Date(NOW - 4 * DAY).toISOString(),
      url: "https://github.com/naledi-khumalo/distributed-task-queue",
      quality: { hasTests: true, hasReadme: true, hasCi: true, hasLicense: true },
      category: "Featured",
    },
    {
      id: "demo-3",
      name: "react-analytics-dashboard",
      description: "Internal analytics dashboard with server-driven charts and role-based access.",
      languages: ["TypeScript", "CSS"],
      stars: 34,
      watchers: 8,
      updatedAt: new Date(NOW - 8 * DAY).toISOString(),
      url: "https://github.com/naledi-khumalo/react-analytics-dashboard",
      quality: { hasTests: true, hasReadme: true, hasCi: false, hasLicense: false },
      category: "Personal",
    },
    {
      id: "demo-4",
      name: "terraform-aws-modules",
      description: "Reusable Terraform modules for VPC, ECS, and RDS baselines used across client projects.",
      languages: ["HCL"],
      stars: 58,
      watchers: 11,
      updatedAt: new Date(NOW - 15 * DAY).toISOString(),
      url: "https://github.com/naledi-khumalo/terraform-aws-modules",
      quality: { hasTests: false, hasReadme: true, hasCi: false, hasLicense: true },
      category: "Personal",
    },
    {
      id: "demo-5",
      name: "ml-pipeline-toolkit",
      description: "CLI toolkit for scheduling and monitoring batch ML training pipelines.",
      languages: ["Python"],
      stars: 21,
      watchers: 4,
      updatedAt: new Date(NOW - 26 * DAY).toISOString(),
      url: "https://github.com/naledi-khumalo/ml-pipeline-toolkit",
      quality: { hasTests: false, hasReadme: true, hasCi: false, hasLicense: false },
      category: "Personal",
    },
  ];

  const overallScore = Math.round(
    Object.values(skillFingerprint).reduce((sum, v) => sum + v, 0) /
      Object.values(skillFingerprint).length
  );

  const profile: DeveloperHubData["profile"] = {
    id: DEMO_GITHUB_ID,
    name: DEMO_DISPLAY_NAME,
    headline: "Senior Backend Engineer",
    location: "Johannesburg, South Africa",
    avatarUrl: "https://i.pravatar.cc/300?img=47",
    githubLogin: "naledi-khumalo",
    availableForOpportunities: true,
    overallScore,
    percentileRank: Math.max(1, Math.round(100 - overallScore * 0.9)),
    about:
      "Senior backend engineer with 7+ years building distributed systems in Go and Python. Focused on payments infrastructure, developer tooling, and mentoring junior engineers.",
  };

  return {
    profile,
    skillFingerprint,
    projects,
    activity,
    analytics: deriveAnalyticsSnapshot({
      followers: activity.followers,
      publicRepoCount: activity.publicRepoCount,
    }),
  };
}

export function buildDemoActivityTimeline(): RepoActivityEvent[] {
  return [
    {
      id: "demo-commit-1",
      repoName: "payments-gateway-core",
      repoUrl: "https://github.com/naledi-khumalo/payments-gateway-core",
      type: "commit",
      title: "Add idempotency key TTL cleanup job",
      url: "https://github.com/naledi-khumalo/payments-gateway-core/commit/a1b2c3d",
      occurredAt: new Date(NOW - 1 * DAY).toISOString(),
    },
    {
      id: "demo-pr-1",
      repoName: "distributed-task-queue",
      repoUrl: "https://github.com/naledi-khumalo/distributed-task-queue",
      type: "pull_request",
      title: "Add exponential backoff to dead-letter retries",
      url: "https://github.com/naledi-khumalo/distributed-task-queue/pull/118",
      occurredAt: new Date(NOW - 3 * DAY).toISOString(),
      state: "merged",
    },
    {
      id: "demo-release-1",
      repoName: "payments-gateway-core",
      repoUrl: "https://github.com/naledi-khumalo/payments-gateway-core",
      type: "release",
      title: "v3.2.0 — multi-currency settlement",
      url: "https://github.com/naledi-khumalo/payments-gateway-core/releases/tag/v3.2.0",
      occurredAt: new Date(NOW - 5 * DAY).toISOString(),
    },
    {
      id: "demo-pr-2",
      repoName: "react-analytics-dashboard",
      repoUrl: "https://github.com/naledi-khumalo/react-analytics-dashboard",
      type: "pull_request",
      title: "Migrate charts to server components",
      url: "https://github.com/naledi-khumalo/react-analytics-dashboard/pull/54",
      occurredAt: new Date(NOW - 8 * DAY).toISOString(),
      state: "merged",
    },
    {
      id: "demo-commit-2",
      repoName: "terraform-aws-modules",
      repoUrl: "https://github.com/naledi-khumalo/terraform-aws-modules",
      type: "commit",
      title: "Pin RDS module to Postgres 16",
      url: "https://github.com/naledi-khumalo/terraform-aws-modules/commit/e5f6a7b",
      occurredAt: new Date(NOW - 12 * DAY).toISOString(),
    },
    {
      id: "demo-pr-3",
      repoName: "ml-pipeline-toolkit",
      repoUrl: "https://github.com/naledi-khumalo/ml-pipeline-toolkit",
      type: "pull_request",
      title: "Add retry policy for flaky training jobs",
      url: "https://github.com/naledi-khumalo/ml-pipeline-toolkit/pull/9",
      occurredAt: new Date(NOW - 17 * DAY).toISOString(),
      state: "open",
    },
  ];
}

function isoDate(daysAgo: number): string {
  return new Date(NOW - daysAgo * DAY).toISOString().slice(0, 10);
}

export const DEMO_WORK_EXPERIENCE: WorkExperience[] = [
  {
    id: "demo-exp-1",
    githubId: DEMO_GITHUB_ID,
    company: "Yoco",
    role: "Senior Backend Engineer",
    location: "Cape Town, South Africa",
    startDate: "2022-03-01",
    endDate: null,
    isCurrent: true,
    description:
      "Leading the payments infrastructure team; designed the idempotent transaction ledger service processing 2M+ transactions/day.",
    createdAt: isoDate(400),
    updatedAt: isoDate(10),
  },
  {
    id: "demo-exp-2",
    githubId: DEMO_GITHUB_ID,
    company: "Takealot.com",
    role: "Backend Engineer",
    location: "Cape Town, South Africa",
    startDate: "2019-06-01",
    endDate: "2022-02-01",
    isCurrent: false,
    description:
      "Built and scaled order-fulfillment microservices; reduced checkout latency by 35% ahead of peak-season traffic.",
    createdAt: isoDate(400),
    updatedAt: isoDate(400),
  },
  {
    id: "demo-exp-3",
    githubId: DEMO_GITHUB_ID,
    company: "Andela",
    role: "Software Engineer",
    location: "Remote",
    startDate: "2017-01-01",
    endDate: "2019-05-01",
    isCurrent: false,
    description:
      "Embedded with US-based fintech clients building REST APIs and internal tooling in Python/Django.",
    createdAt: isoDate(400),
    updatedAt: isoDate(400),
  },
];

export const DEMO_CERTIFICATIONS: Certification[] = [
  {
    id: "demo-cert-1",
    githubId: DEMO_GITHUB_ID,
    name: "AWS Certified Solutions Architect – Professional",
    issuer: "Amazon Web Services",
    issueDate: "2024-04-01",
    expiryDate: "2027-04-01",
    credentialId: "AWS-PSA-2024-88213",
    credentialUrl: null,
    description: null,
    createdAt: isoDate(300),
    updatedAt: isoDate(300),
  },
  {
    id: "demo-cert-2",
    githubId: DEMO_GITHUB_ID,
    name: "Certified Kubernetes Administrator (CKA)",
    issuer: "The Linux Foundation",
    issueDate: "2023-09-01",
    expiryDate: "2026-09-01",
    credentialId: "CKA-2023-51042",
    credentialUrl: null,
    description: null,
    createdAt: isoDate(300),
    updatedAt: isoDate(300),
  },
  {
    id: "demo-cert-3",
    githubId: DEMO_GITHUB_ID,
    name: "Professional Cloud Developer",
    issuer: "Google Cloud",
    issueDate: "2022-11-01",
    expiryDate: null,
    credentialId: null,
    credentialUrl: null,
    description: null,
    createdAt: isoDate(300),
    updatedAt: isoDate(300),
  },
];

/**
 * Skill test templates are shared, non-user-specific reference data (read
 * straight from Supabase), so the demo account reuses whatever templates
 * are actually configured rather than hardcoding IDs — only the *attempts*
 * are synthesized, as strong-but-not-perfect completed scores.
 */
export function buildDemoAttemptSummaries(
  templates: SkillTestTemplate[]
): Map<string, SkillTestAttemptSummary> {
  const scores = [94, 87, 91, 83, 96, 89];
  const summaries = new Map<string, SkillTestAttemptSummary>();
  templates.forEach((template, i) => {
    summaries.set(template.id, {
      templateId: template.id,
      status: "completed",
      bestPercentage: scores[i % scores.length],
      latestAttemptId: `demo-attempt-${template.id}`,
      completedAt: new Date(NOW - (5 + i * 3) * DAY).toISOString(),
    });
  });
  return summaries;
}

/**
 * Not backed by the notifications table — the demo account's write routes
 * are all blocked, so it would never generate a real one. Mark-as-read for
 * these is a harmless client-side-only no-op (see the API routes), which is
 * fine since this inbox is meant to look lived-in, not to persist per-visitor.
 */
export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "demo-notif-1",
    type: "skill_test_completed",
    title: "Scored 94% on a Verified Skills test",
    body: "Nice work — that puts you in the top tier for this stack.",
    link: "/dashboard/skills",
    isRead: false,
    createdAt: new Date(NOW - 1 * DAY).toISOString(),
  },
  {
    id: "demo-notif-2",
    type: "certification_added",
    title: "Certification added",
    body: "AWS Certified Solutions Architect – Professional",
    link: "/dashboard/certifications",
    isRead: false,
    createdAt: new Date(NOW - 3 * DAY).toISOString(),
  },
  {
    id: "demo-notif-3",
    type: "experience_added",
    title: "Experience added",
    body: "Senior Backend Engineer at Yoco",
    link: "/dashboard/experience",
    isRead: true,
    createdAt: new Date(NOW - 10 * DAY).toISOString(),
  },
  {
    id: "demo-notif-4",
    type: "welcome",
    title: "Welcome to IPSkill",
    body: "Your developer hub is set up — explore your skill fingerprint, projects, and verified tests.",
    link: "/dashboard/profile",
    isRead: true,
    createdAt: new Date(NOW - 40 * DAY).toISOString(),
  },
];

/**
 * Mirrors the fixture rows seeded directly into the real directory_profiles
 * table (see the create_directory_and_profile_views migration), plus the
 * demo persona herself — the demo account never writes to real Supabase, so
 * it needs its own copy of the same directory to browse and click into.
 */
export const DEMO_DIRECTORY_ENTRIES: DirectoryEntry[] = [
  {
    githubId: DEMO_GITHUB_ID,
    githubLogin: "naledi-khumalo",
    displayName: DEMO_DISPLAY_NAME,
    avatarUrl: "https://i.pravatar.cc/300?img=47",
    headline: "Senior Backend Engineer",
    location: "Johannesburg, South Africa",
    overallScore: 78,
    topLanguages: ["Go", "TypeScript", "Python"],
    availableForOpportunities: true,
    about:
      "Senior backend engineer with 7+ years building distributed systems in Go and Python. Focused on payments infrastructure, developer tooling, and mentoring junior engineers.",
    lastActiveAt: new Date(NOW - 1 * DAY).toISOString(),
  },
  {
    githubId: "seed-1",
    githubLogin: "thabo-mokoena",
    displayName: "Thabo Mokoena",
    avatarUrl: "https://i.pravatar.cc/300?img=12",
    headline: "Frontend Engineer",
    location: "Pretoria, South Africa",
    overallScore: 81,
    topLanguages: ["TypeScript", "React", "CSS"],
    availableForOpportunities: true,
    about: "Frontend engineer focused on accessible, performant web apps.",
    lastActiveAt: new Date(NOW - 2 * DAY).toISOString(),
  },
  {
    githubId: "seed-2",
    githubLogin: "lerato-dube",
    displayName: "Lerato Dube",
    avatarUrl: "https://i.pravatar.cc/300?img=45",
    headline: "DevOps Engineer",
    location: "Cape Town, South Africa",
    overallScore: 88,
    topLanguages: ["Go", "Terraform", "Kubernetes"],
    availableForOpportunities: true,
    about: "DevOps engineer running Kubernetes platforms for fintech clients.",
    lastActiveAt: new Date(NOW - 4 * DAY).toISOString(),
  },
  {
    githubId: "seed-3",
    githubLogin: "sipho-nkosi",
    displayName: "Sipho Nkosi",
    avatarUrl: "https://i.pravatar.cc/300?img=33",
    headline: "Data Engineer",
    location: "Durban, South Africa",
    overallScore: 74,
    topLanguages: ["Python", "SQL", "Airflow"],
    availableForOpportunities: false,
    about: "Data engineer building batch and streaming pipelines.",
    lastActiveAt: new Date(NOW - 6 * DAY).toISOString(),
  },
  {
    githubId: "seed-4",
    githubLogin: "amahle-vilakazi",
    displayName: "Amahle Vilakazi",
    avatarUrl: "https://i.pravatar.cc/300?img=25",
    headline: "Mobile Engineer",
    location: "Johannesburg, South Africa",
    overallScore: 79,
    topLanguages: ["Swift", "Kotlin"],
    availableForOpportunities: true,
    about: "Mobile engineer shipping iOS and Android apps for retail.",
    lastActiveAt: new Date(NOW - 8 * DAY).toISOString(),
  },
  {
    githubId: "seed-5",
    githubLogin: "jaco-bester",
    displayName: "Jaco Bester",
    avatarUrl: "https://i.pravatar.cc/300?img=53",
    headline: "Backend Engineer",
    location: "Stellenbosch, South Africa",
    overallScore: 85,
    topLanguages: ["Java", "PostgreSQL"],
    availableForOpportunities: true,
    about: "Backend engineer specializing in payments and ledger systems.",
    lastActiveAt: new Date(NOW - 12 * DAY).toISOString(),
  },
];
