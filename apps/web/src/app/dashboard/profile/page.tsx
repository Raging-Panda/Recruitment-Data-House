import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { loadDeveloperHubData, loadContributionCalendar } from "@/lib/developer-data";
import { getCandidateProfileOverrideSafe } from "@/lib/candidate-profile";
import { getFeaturedProjectsSafe, MAX_FEATURED_PROJECTS } from "@/lib/featured-projects";
import { getOnboardingChecklist } from "@/lib/onboarding";
import { syncDirectoryProfile } from "@/lib/directory";
import { getEndorsementsFor } from "@/lib/endorsements";
import { getPublicProfileLinkStatus, type PublicProfileLinkStatus } from "@/lib/public-profile-link";
import { getSkillTestOptions, type SkillTestOption } from "@/lib/skill-test-options";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToWorkExperience } from "@/lib/experience";
import { rowToCertification } from "@/lib/certifications";
import { isDemoAccount } from "@/lib/demo-mode";
import { isTestAccount } from "@/lib/test-mode";
import { getGithubAccessToken } from "@/lib/github-connection";
import {
  DEMO_ENDORSEMENTS,
  DEMO_PUBLIC_LINK_STATUS,
  DEMO_WORK_EXPERIENCE,
  DEMO_CERTIFICATIONS,
} from "@/lib/demo-data";
import { InfoCard } from "@/components/info-card";
import { ScoreRing } from "@/components/score-ring";
import { DisplayNameEditor } from "@/components/display-name-editor";
import { ProfileNarrativeEditor } from "@/components/profile-narrative-editor";
import { FeaturedProjectsManager } from "@/components/featured-projects-manager";
import { CareerTimeline } from "@/components/career-timeline";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { EndorsementList } from "@/components/endorsement-list";
import { PublicProfileLinkCard } from "@/components/public-profile-link-card";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { GetVerifiedSkillButton } from "@/components/get-verified-skill-modal";
import { EmptyState } from "@/components/empty-state";
import { CodeIcon } from "@/components/icons";
import { buttonClass } from "@/lib/button-styles";
import { getPublicIdentitySafe } from "@/lib/public-identity";
import { PublicIdentityCard } from "@/components/public-identity-card";
import { ExternalLinksManager } from "@/components/external-links-manager";
import { getExternalLinksSafe } from "@/lib/external-links";
import type { ContributionDay, Endorsement, WorkExperience, Certification } from "@ipskill/shared";

const EMPTY_LINK_STATUS: PublicProfileLinkStatus = {
  token: null,
  path: null,
  createdAt: null,
  expiresAt: null,
  isExpired: false,
  isRevoked: false,
  viewCount: 0,
};

async function loadCareerHistory(
  githubId: string,
  isDemo: boolean
): Promise<{ experience: WorkExperience[]; certifications: Certification[] }> {
  if (isDemo) {
    return { experience: DEMO_WORK_EXPERIENCE, certifications: DEMO_CERTIFICATIONS };
  }
  try {
    const supabase = getSupabaseAdmin();
    const [exp, cert] = await Promise.all([
      supabase
        .from("work_experience")
        .select("*")
        .eq("github_id", githubId)
        .order("start_date", { ascending: false }),
      supabase
        .from("certifications")
        .select("*")
        .eq("github_id", githubId)
        .order("issue_date", { ascending: false }),
    ]);
    return {
      experience: (exp.data ?? []).map(rowToWorkExperience),
      certifications: (cert.data ?? []).map(rowToCertification),
    };
  } catch {
    return { experience: [], certifications: [] };
  }
}

/**
 * Profile for an account with no GitHub connection (currently: Google
 * sign-ins only — demo/test/github all carry a GitHub token). Everything
 * here is Supabase-only: the authored narrative, career timeline,
 * endorsements, and Verified Skills all work exactly the same as the full
 * profile. What's missing is anything derived from a GitHub API call —
 * the fingerprint, avatar/headline/location, featured-project picker
 * (nothing to pick from), contribution heatmap, PDF export, and the public
 * share link (built from the directory snapshot, which is itself only
 * ever synced from the GitHub-connected profile page below).
 */
async function ThinProfile({ session }: { session: Session }) {
  const githubId = session.githubId!;
  const [override, career, skillTestOptions] = await Promise.all([
    getCandidateProfileOverrideSafe(githubId),
    loadCareerHistory(githubId, false),
    getSkillTestOptions().catch(() => [] as SkillTestOption[]),
  ]);

  let endorsements: Endorsement[] = [];
  if (!isTestAccount(githubId)) {
    try {
      endorsements = await getEndorsementsFor(githubId);
    } catch {
      endorsements = [];
    }
  }

  const displayName = override?.displayName ?? session.user?.name ?? "Developer";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-heading">My Profile</h1>
      <p className="mt-1 text-sm text-text-secondary">
        No GitHub connected yet — the parts only you can tell, plus GitHub-derived analysis once
        you connect it.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-surface-border bg-background-elevated p-6 md:grid-cols-[auto_1fr]">
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={displayName}
            width={88}
            height={88}
            className="rounded-full"
          />
        ) : (
          <div className="h-[88px] w-[88px] rounded-full bg-primary-gradient" />
        )}
        <div>
          <DisplayNameEditor initialName={displayName} />
          <p className="text-sm text-text-secondary">{session.user?.email}</p>
        </div>
      </div>

      <EmptyState
        className="mt-6"
        icon={CodeIcon}
        title="No GitHub-derived signal yet"
        description="Your skill fingerprint, project list, contribution heatmap, and Analytics all come from GitHub activity. Connect it in Settings to generate them, right here on this profile."
        action={
          <a href="/dashboard/settings" className={buttonClass("primary", "sm")}>
            Connect GitHub
          </a>
        }
      />

      <div className="mt-6">
        <ProfileNarrativeEditor
          initialAbout={override?.aboutAuthored ?? null}
          githubBio={null}
          initialCurrently={override?.currently ?? null}
          initialCurrentlyUpdatedAt={override?.currentlyUpdatedAt ?? null}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-5">
        <h2 className="text-sm font-semibold text-heading">Verified Skills</h2>
        <p className="mt-1 text-sm text-text-muted">
          Proctored-free knowledge checks — don&apos;t need GitHub, a good way to build signal in
          the meantime.
        </p>
        <div className="mt-2">
          <GetVerifiedSkillButton options={skillTestOptions} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-heading">Career Timeline</h2>
        <p className="mt-1 text-xs text-text-muted">Roles and certifications as one dated story.</p>
        <div className="mt-4">
          <CareerTimeline experience={career.experience} certifications={career.certifications} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-heading">Endorsements</h2>
        <div className="mt-4">
          <EndorsementList endorsements={endorsements} />
        </div>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const isDemo = isDemoAccount(session!.githubId);

  const githubToken = await getGithubAccessToken(session);
  if (!githubToken) {
    return <ThinProfile session={session!} />;
  }

  const [{ profile, activity, projects, skillFingerprint }, override, featuredProjects, career, identity, externalLinks] =
    await Promise.all([
      loadDeveloperHubData(githubToken, session!.githubId!),
      getCandidateProfileOverrideSafe(session!.githubId!),
      getFeaturedProjectsSafe(session!.githubId!),
      loadCareerHistory(session!.githubId!, isDemo),
      getPublicIdentitySafe(session!.githubId!),
      getExternalLinksSafe(session!.githubId!),
    ]);

  const displayName = override?.displayName ?? profile.name;
  const aboutAuthored = override?.aboutAuthored ?? null;
  const checklist = await getOnboardingChecklist(
    session!.githubId!,
    profile,
    Boolean(override?.displayName)
  );

  let endorsements: Endorsement[] = [];
  let linkStatus: PublicProfileLinkStatus = EMPTY_LINK_STATUS;
  if (isDemo) {
    endorsements = DEMO_ENDORSEMENTS[session!.githubId!] ?? [];
    linkStatus = DEMO_PUBLIC_LINK_STATUS;
  } else if (!isTestAccount(session!.githubId)) {
    void syncDirectoryProfile(
      session!.githubId!,
      displayName,
      profile,
      activity,
      skillFingerprint,
      aboutAuthored,
      identity
    );
    try {
      endorsements = await getEndorsementsFor(session!.githubId!);
    } catch {
      endorsements = [];
    }
    try {
      linkStatus = await getPublicProfileLinkStatus(session!.githubId!);
    } catch {
      linkStatus = EMPTY_LINK_STATUS;
    }
  }

  let contributionDays: ContributionDay[] = [];
  try {
    contributionDays = await loadContributionCalendar(
      githubToken,
      session!.githubId!,
      profile.githubLogin
    );
  } catch {
    contributionDays = [];
  }

  let skillTestOptions: SkillTestOption[] = [];
  try {
    skillTestOptions = await getSkillTestOptions();
  } catch {
    skillTestOptions = [];
  }

  const availableRepos = projects.map((p) => ({
    name: p.name,
    url: p.url,
    languages: p.languages,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-heading">My Profile</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Your developer profile — GitHub signals, plus the parts only you can tell.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-surface-border bg-background-elevated p-6 md:grid-cols-[auto_1fr_auto]">
        <Image
          src={profile.avatarUrl}
          alt={displayName}
          width={88}
          height={88}
          className="rounded-full"
        />
        <div>
          <DisplayNameEditor initialName={displayName} />
          <p className="text-sm text-text-secondary">{profile.headline}</p>
          {profile.location && (
            <p className="mt-1 text-xs text-text-muted">📍 {profile.location}</p>
          )}
          <p className="mt-3 line-clamp-3 max-w-md whitespace-pre-line text-sm text-text-secondary">
            {aboutAuthored ?? profile.about ?? "No bio yet — add one in the About section below."}
          </p>
          <p className="mt-3 text-xs text-text-muted">@{profile.githubLogin}</p>
        </div>
        <ScoreRing score={checklist.percentage} label="Profile Completion" />
      </div>

      <OnboardingChecklist items={checklist.items} percentage={checklist.percentage} />

      <div className="mt-6">
        <ProfileNarrativeEditor
          initialAbout={aboutAuthored}
          githubBio={profile.about}
          initialCurrently={override?.currently ?? null}
          initialCurrentlyUpdatedAt={override?.currentlyUpdatedAt ?? null}
          readOnly={isDemo}
        />
      </div>

      <div className="mt-8">
        <FeaturedProjectsManager
          initialEntries={featuredProjects}
          availableRepos={availableRepos}
          maxEntries={MAX_FEATURED_PROJECTS}
          readOnly={isDemo}
        />
      </div>

      <div className="mt-8">
        <ExternalLinksManager initialEntries={externalLinks} readOnly={isDemo} />
      </div>

      <div className="mt-8">
        <PublicIdentityCard
          initialHandle={identity.handle}
          initialVisibility={identity.visibility}
          initialCompany={identity.company}
          readOnly={isDemo}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <InfoCard title="Personal Information">
          <Row label="Full Name" value={displayName} />
          <Row label="Location" value={profile.location ?? "Not set on GitHub"} />
        </InfoCard>

        <InfoCard title="Professional Information">
          <Row label="Headline" value={profile.headline} />
          <Row label="Public Repos" value={String(activity.publicRepoCount)} />
          <Row label="Followers" value={String(activity.followers)} />
          <Row
            label="Availability"
            value={profile.availableForOpportunities ? "Open to Opportunities" : "Not available"}
          />
        </InfoCard>

        <InfoCard title="Account Security">
          <Row label="Auth Method" value="GitHub OAuth" />
          <Row label="Account Status" value="Verified via GitHub ✓" />
        </InfoCard>

        <InfoCard title="Social Profiles">
          <Row label="GitHub" value={`github.com/${profile.githubLogin}`} />
        </InfoCard>

        <InfoCard title="Resume/CV">
          <p className="text-sm text-text-muted">
            Resume upload isn&apos;t wired up yet — coming in a later milestone.
          </p>
        </InfoCard>

        <PublicProfileLinkCard initialStatus={linkStatus} isDemo={isDemo} />

        <InfoCard title="Export Profile">
          <p className="pt-1 text-sm text-text-muted">
            A one-page PDF summary of your profile and skill fingerprint — pairs well with your
            share link above for sending directly to a client.
          </p>
          <a
            href="/api/profile/pdf"
            download={`ipskill-${profile.githubLogin}-profile.pdf`}
            className={`${buttonClass("primary", "sm")} mt-2 inline-flex`}
          >
            Download PDF
          </a>
        </InfoCard>

        <InfoCard title="Verified Skills">
          <p className="pt-1 text-sm text-text-muted">
            Add another language or framework to your Verified Skills — a proctored-free knowledge
            check, separate from your GitHub-derived fingerprint.
          </p>
          <div className="mt-2">
            <GetVerifiedSkillButton options={skillTestOptions} />
          </div>
        </InfoCard>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-heading">Career Timeline</h2>
        <p className="mt-1 text-xs text-text-muted">
          Roles and certifications as one dated story. Day-to-day GitHub activity lives on the
          Projects page.
        </p>
        <div className="mt-4">
          <CareerTimeline experience={career.experience} certifications={career.certifications} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-5">
        <h2 className="text-sm font-semibold text-heading">Contribution Activity</h2>
        <p className="mt-1 text-xs text-text-secondary">
          A consistency signal at a glance — easier to scan than the weekly commit trend on
          Analytics.
        </p>
        <div className="mt-4">
          <ContributionHeatmap days={contributionDays} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-heading">Endorsements</h2>
        <p className="mt-1 text-xs text-text-muted">
          A human signal from other developers on the platform, alongside your GitHub-derived
          fingerprint. Given by other devs from your Directory profile.
        </p>
        <div className="mt-4">
          <EndorsementList endorsements={endorsements} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-heading">{value}</span>
    </div>
  );
}
