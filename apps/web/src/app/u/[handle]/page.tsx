import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import type { Endorsement } from "@ipskill/shared";
import { authOptions } from "@/lib/auth";
import { isDemoAccount } from "@/lib/demo-mode";
import { getDirectoryEntryByHandle } from "@/lib/directory";
import { getEndorsementsFor } from "@/lib/endorsements";
import { getExternalLinksSafe } from "@/lib/external-links";
import { ScoreRing } from "@/components/score-ring";
import { EndorsementList } from "@/components/endorsement-list";
import { EndorsementForm } from "@/components/endorsement-form";
import { IPSkillLogo } from "@/components/ipskill-logo";
import { SkillRadarChartLazy as SkillRadarChart } from "@/components/skill-radar-chart-lazy";

// Unauthenticated route — no cookies()/session read, so Next won't treat
// it as dynamic automatically and the fetch data-cache can otherwise
// serve a stale snapshot after the first request. Confirmed live: a
// newly-added external link didn't show up on reload without this.
export const dynamic = "force-dynamic";

/**
 * The permanent, ownable, SEO-indexable public profile — distinct from
 * /p/[token] (a private, expiring, unguessable share link). This is the
 * "vanity handle" north-star item: a link a developer can put in their
 * GitHub bio and have it actually be findable.
 */
export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const entry = await getDirectoryEntryByHandle(params.handle).catch(() => null);
  if (!entry) return { title: "Profile not found — IPSkill" };

  const title = `${entry.displayName} — ${entry.headline ?? "Developer"} | IPSkill`;
  const description =
    entry.about?.slice(0, 160) ??
    `${entry.displayName}'s verified developer profile on IPSkill — ${entry.overallScore}% overall score.`;

  return {
    title,
    description,
    openGraph: { title, description, images: [`/u/${params.handle}/opengraph-image`] },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicHandleProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const entry = await getDirectoryEntryByHandle(params.handle).catch(() => null);
  if (!entry) notFound();

  // Reading the session here is safe re: the stale-cache concern the
  // comment above documents — `dynamic` is already forced, so this
  // doesn't change whether Next treats the route as dynamic.
  const session = await getServerSession(authOptions);
  const viewerGithubId = session?.githubId ?? null;
  const canEndorse =
    !!viewerGithubId && !isDemoAccount(viewerGithubId) && viewerGithubId !== entry.githubId;

  let endorsements: Endorsement[] = [];
  try {
    endorsements = await getEndorsementsFor(entry.githubId);
  } catch {
    endorsements = [];
  }
  const externalLinks = await getExternalLinksSafe(entry.githubId);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2">
          <IPSkillLogo size={28} />
          <span className="text-sm font-extrabold text-heading">IPSkill</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-surface-border bg-background-elevated p-6 md:grid-cols-[auto_1fr_auto]">
          {entry.avatarUrl ? (
            <Image src={entry.avatarUrl} alt={entry.displayName} width={88} height={88} className="rounded-full" />
          ) : (
            <div className="h-[88px] w-[88px] rounded-full bg-primary-gradient" />
          )}
          <div>
            <h1 className="text-lg font-semibold text-heading">{entry.displayName}</h1>
            <p className="text-sm text-text-secondary">{entry.headline}</p>
            {entry.location && <p className="mt-1 text-xs text-text-muted">📍 {entry.location}</p>}
            {entry.company && <p className="text-xs text-text-muted">🏢 {entry.company}</p>}
            <p className="mt-3 max-w-md whitespace-pre-line text-sm text-text-secondary">
              {entry.about ?? "No bio provided."}
            </p>
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
                {entry.topLanguages.map((lang) => (
                  <span key={lang} className="rounded-full bg-surface px-3 py-1 text-xs text-text-secondary">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
              <h2 className="text-sm font-semibold text-heading">Availability</h2>
              <p className="mt-3 text-sm text-text-secondary">
                {entry.availableForOpportunities ? "Open to opportunities" : "Not currently available"}
              </p>
            </div>
          </div>
        </div>

        {externalLinks.length > 0 && (
          <div className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-5">
            <h2 className="text-sm font-semibold text-heading">Beyond GitHub</h2>
            <ul className="mt-3 space-y-2">
              {externalLinks.map((link) => (
                <li key={link.id} className="text-sm">
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-5">
          <h2 className="text-sm font-semibold text-heading">Endorsements</h2>
          <div className="mt-3">
            <EndorsementList endorsements={endorsements} />
          </div>
          {canEndorse ? (
            <EndorsementForm candidateGithubId={entry.githubId} candidateName={entry.displayName} />
          ) : (
            !viewerGithubId && (
              <p className="mt-3 text-xs text-text-muted">
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{" "}
                to endorse {entry.displayName.split(" ")[0]}.
              </p>
            )
          )}
        </div>

        <p className="mt-8 text-center text-xs text-text-muted">
          <a href={`/api/badge/${params.handle}.svg`} className="underline decoration-dotted">
            Embeddable badge
          </a>{" "}
          · A verified developer profile on IPSkill.
        </p>
      </div>
    </div>
  );
}
