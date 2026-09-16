import { notFound } from "next/navigation";
import Image from "next/image";
import type { Endorsement } from "@ipskill/shared";
import { getDirectoryEntryByPublicToken } from "@/lib/public-profile-link";
import { getEndorsementsFor } from "@/lib/endorsements";
import { getSkillProofsForSafe } from "@/lib/skill-proofs";
import { SkillProofsList } from "@/components/skill-proofs-list";
import { getFeaturedProjectsSafe, MAX_FEATURED_PROJECTS } from "@/lib/featured-projects";
import { FeaturedProjectsManager } from "@/components/featured-projects-manager";
import { relativeDate } from "@/lib/time-ago";

// Unauthenticated route — no cookies()/session read to make Next treat it
// as dynamic automatically (that's what protects every /dashboard page),
// so without this, Next's fetch data-cache can serve a stale snapshot
// after the first request: a revoked/regenerated link or an edited
// profile wouldn't show as changed. Found live while verifying the
// sibling /u/[handle] route.
export const dynamic = "force-dynamic";
import { ScoreRing } from "@/components/score-ring";
import { EndorsementList } from "@/components/endorsement-list";
import { IPSkillLogo } from "@/components/ipskill-logo";
import { SkillRadarChartLazy as SkillRadarChart } from "@/components/skill-radar-chart-lazy";

/**
 * Unauthenticated, candidate-controlled share view — the URL contains an
 * unguessable token (see public_profile_links), not a session, so this
 * route sits outside /dashboard entirely and inherits only the root
 * layout (theme, fonts), not the sidebar/session gate.
 */
export default async function PublicProfilePage({ params }: { params: { token: string } }) {
  const result = await getDirectoryEntryByPublicToken(params.token).catch(() => null);
  if (!result) notFound();
  const { entry } = result;

  let endorsements: Endorsement[] = [];
  try {
    endorsements = await getEndorsementsFor(entry.githubId);
  } catch {
    endorsements = [];
  }
  const skillProofs = await getSkillProofsForSafe(entry.githubId);
  const featuredProjects = await getFeaturedProjectsSafe(entry.githubId);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2">
          <IPSkillLogo size={28} />
          <span className="text-sm font-extrabold text-heading">IPSkill</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-surface-border bg-background-elevated p-6 md:grid-cols-[auto_1fr_auto]">
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
          <ScoreRing score={entry.overallScore} label="Overall Score" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-surface-border bg-background-elevated p-6">
            <h2 className="text-sm font-semibold text-heading">Skill Fingerprint</h2>
            <SkillRadarChart fingerprint={entry.skillFingerprint} />
          </div>

          <div className="flex flex-col gap-6">
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
          <div className="mt-3">
            <EndorsementList endorsements={endorsements} />
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-text-muted">
          Shared via IPSkill — a read-only view of a verified developer profile.
        </p>
      </div>
    </div>
  );
}
