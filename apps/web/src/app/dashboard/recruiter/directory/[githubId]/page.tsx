import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getDirectoryEntry } from "@/lib/directory";
import { recordProfileView } from "@/lib/profile-views";
import { getEndorsementsFor } from "@/lib/endorsements";
import { isDemoAccount } from "@/lib/demo-mode";
import { getMessagePreference } from "@/lib/message-preference";
import { getSkillProofsForSafe } from "@/lib/skill-proofs";
import { SkillProofsList } from "@/components/skill-proofs-list";
import { getFeaturedProjectsSafe, MAX_FEATURED_PROJECTS } from "@/lib/featured-projects";
import { FeaturedProjectsManager } from "@/components/featured-projects-manager";
import { relativeDate } from "@/lib/time-ago";
import { DEMO_DIRECTORY_ENTRIES, DEMO_ENDORSEMENTS } from "@/lib/demo-data";
import { ScoreRing } from "@/components/score-ring";
import { ArrowRightIcon } from "@/components/icons";
import { EndorsementList } from "@/components/endorsement-list";
import { EndorsementForm } from "@/components/endorsement-form";
import { FollowButton } from "@/components/follow-button";
import { MessageButton } from "@/components/message-button";
import { isFollowing } from "@/lib/social";
import { generateCandidateSummary } from "@/lib/candidate-summary";
import type { DirectoryEntry, Endorsement } from "@ipskill/shared";

export default async function DirectoryProfilePage({
  params,
}: {
  params: { githubId: string };
}) {
  const session = await getServerSession(authOptions);
  const viewerGithubId = session!.githubId!;
  const isDemo = isDemoAccount(viewerGithubId);

  let entry: DirectoryEntry | null;
  let endorsements: Endorsement[] = [];
  if (isDemo) {
    entry = DEMO_DIRECTORY_ENTRIES.find((e) => e.githubId === params.githubId) ?? null;
    endorsements = DEMO_ENDORSEMENTS[params.githubId] ?? [];
  } else {
    try {
      entry = await getDirectoryEntry(params.githubId);
    } catch {
      entry = null;
    }
    if (entry) {
      void recordProfileView(params.githubId, viewerGithubId);
      try {
        endorsements = await getEndorsementsFor(params.githubId);
      } catch {
        endorsements = [];
      }
    }
  }

  if (!entry) {
    notFound();
  }

  const alreadyFollowing =
    !isDemo && viewerGithubId !== entry.githubId
      ? await isFollowing(viewerGithubId, entry.githubId).catch(() => false)
      : false;

  const messagePreference =
    !isDemo && viewerGithubId !== entry.githubId
      ? await getMessagePreference(entry.githubId).catch(() => "open" as const)
      : "open";

  const skillProofs = await getSkillProofsForSafe(entry.githubId);
  const featuredProjects = await getFeaturedProjectsSafe(entry.githubId);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/recruiter/directory"
        className="text-sm text-text-secondary hover:text-heading"
      >
        ← Back to Directory
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 rounded-2xl border border-surface-border bg-background-elevated p-6 md:grid-cols-[auto_1fr_auto]">
        {entry.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt={entry.displayName}
            width={88}
            height={88}
            className="rounded-full"
          />
        ) : (
          <div className="h-[88px] w-[88px] rounded-full bg-primary-gradient" />
        )}
        <div>
          <h1 className="text-lg font-semibold text-heading">{entry.displayName}</h1>
          <p className="text-sm text-text-secondary">{entry.headline}</p>
          {entry.location && <p className="mt-1 text-xs text-text-muted">📍 {entry.location}</p>}
          <p className="mt-2 max-w-md text-xs italic text-text-muted">
            {generateCandidateSummary(entry.displayName, entry.overallScore, entry.skillFingerprint, entry.topLanguages)}
          </p>
          <p className="mt-3 max-w-md text-sm text-text-secondary">
            {entry.about ?? "No bio provided."}
          </p>
          {entry.currently && (
            <p className="mt-2 max-w-md text-xs text-text-secondary">
              <span className="font-medium text-heading">Currently:</span> {entry.currently}
              {entry.currentlyUpdatedAt && (
                <span className="text-text-muted"> · updated {relativeDate(entry.currentlyUpdatedAt)}</span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-3">
          <ScoreRing score={entry.overallScore} label="Overall Score" />
          {viewerGithubId !== entry.githubId && (
            <FollowButton
              targetId={entry.githubId}
              initialFollowing={alreadyFollowing}
              readOnly={isDemo}
            />
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
          <h2 className="text-sm font-semibold text-heading">Top Languages</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.topLanguages.length > 0 ? (
              entry.topLanguages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-surface px-3 py-1 text-xs text-text-secondary"
                >
                  {lang}
                </span>
              ))
            ) : (
              <p className="text-sm text-text-muted">No language data yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
          <h2 className="text-sm font-semibold text-heading">Availability</h2>
          <p className="mt-3 text-sm text-text-secondary">
            {entry.availableForOpportunities
              ? "Open to opportunities"
              : "Not currently available"}
          </p>
        </div>
      </div>

      {featuredProjects.length > 0 && (
        <div className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-5">
          <FeaturedProjectsManager
            initialEntries={featuredProjects}
            availableRepos={[]}
            maxEntries={MAX_FEATURED_PROJECTS}
            readOnly
          />
        </div>
      )}

      {skillProofs.length > 0 && (
        <div className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-5">
          <h2 className="text-sm font-semibold text-heading">Proof of Work</h2>
          <div className="mt-3">
            <SkillProofsList proofs={skillProofs} />
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-5">
        <h2 className="text-sm font-semibold text-heading">Endorsements</h2>
        <p className="mt-1 text-xs text-text-secondary">
          A human signal from other developers on the platform, alongside the GitHub-derived
          fingerprint.
        </p>
        <div className="mt-3">
          <EndorsementList endorsements={endorsements} />
        </div>
        {!isDemo && viewerGithubId !== entry.githubId && (
          <EndorsementForm candidateGithubId={entry.githubId} candidateName={entry.displayName} />
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-surface-border bg-background-elevated p-5 text-center">
        {!isDemo && viewerGithubId !== entry.githubId ? (
          <div className="flex justify-center">
            <MessageButton targetId={entry.githubId} preference={messagePreference} />
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            {isDemo ? "Messaging isn't available on the shared demo account." : "This is your own profile."}
          </p>
        )}
        <Link
          href="/dashboard/recruiter/directory"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Browse more developers <ArrowRightIcon size={14} />
        </Link>
      </div>
    </div>
  );
}
