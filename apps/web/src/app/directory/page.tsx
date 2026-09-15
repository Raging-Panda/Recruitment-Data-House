import Image from "next/image";
import Link from "next/link";
import { getPublicDirectoryEntries } from "@/lib/directory";
import { getPublicTrendingDevelopers } from "@/lib/growth";
import { IPSkillLogo } from "@/components/ipskill-logo";

export const metadata = { title: "Developer Directory — IPSkill" };

/**
 * The public, unauthenticated counterpart to the premium-gated Recruiter
 * Directory — anyone can browse, no login, no paywall, only opted-in
 * (visibility="public") profiles. A discovery path for a strong-but-
 * unknown developer, not a lead-gen tool for recruiters.
 */
export default async function PublicDirectoryPage() {
  const [entries, trending] = await Promise.all([
    getPublicDirectoryEntries().catch(() => []),
    getPublicTrendingDevelopers().catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2">
          <IPSkillLogo size={28} />
          <span className="text-sm font-extrabold text-heading">IPSkill</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-heading">Developer Directory</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Developers who've made their IPSkill profile public. {entries.length} listed.
        </p>

        {trending.length > 0 && (
          <div className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              📈 Trending this month
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {trending.map((t) => (
                <span key={t.githubId} className="rounded-full bg-surface px-3 py-1 text-xs text-text-secondary">
                  {t.displayName} · +{t.growthScore} pts
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={entry.githubId}
              href={`/u/${entry.handle}`}
              className="rounded-2xl border border-surface-border bg-background-elevated p-5 transition hover:border-primary"
            >
              <div className="flex items-center gap-3">
                {entry.avatarUrl ? (
                  <Image src={entry.avatarUrl} alt={entry.displayName} width={44} height={44} className="rounded-full" />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-primary-gradient" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-heading">{entry.displayName}</p>
                  <p className="truncate text-xs text-text-secondary">{entry.headline}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.topLanguages.slice(0, 3).map((lang) => (
                  <span key={lang} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-text-secondary">
                    {lang}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-primary">{entry.overallScore}% overall score</p>
            </Link>
          ))}
        </div>

        {entries.length === 0 && (
          <p className="mt-10 text-center text-sm text-text-muted">
            No public profiles yet — be the first from Profile → Public Profile.
          </p>
        )}
      </div>
    </div>
  );
}
