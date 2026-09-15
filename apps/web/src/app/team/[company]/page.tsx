import Image from "next/image";
import Link from "next/link";
import { getPublicDirectoryEntriesByCompany } from "@/lib/directory";
import { IPSkillLogo } from "@/components/ipskill-logo";

export default async function TeamPage({ params }: { params: { company: string } }) {
  const company = decodeURIComponent(params.company);
  const entries = await getPublicDirectoryEntriesByCompany(company).catch(() => []);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2">
          <IPSkillLogo size={28} />
          <span className="text-sm font-extrabold text-heading">IPSkill</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-heading">{company} on IPSkill</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {entries.length} public {entries.length === 1 ? "profile" : "profiles"} tagged with this company.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {entries.map((entry) => (
            <Link
              key={entry.githubId}
              href={`/u/${entry.handle}`}
              className="flex items-center gap-3 rounded-2xl border border-surface-border bg-background-elevated p-4 transition hover:border-primary"
            >
              {entry.avatarUrl ? (
                <Image src={entry.avatarUrl} alt={entry.displayName} width={40} height={40} className="rounded-full" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary-gradient" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-heading">{entry.displayName}</p>
                <p className="truncate text-xs text-text-secondary">{entry.headline}</p>
              </div>
            </Link>
          ))}
        </div>

        {entries.length === 0 && (
          <p className="mt-10 text-center text-sm text-text-muted">
            No public profiles tagged with this company yet.
          </p>
        )}
      </div>
    </div>
  );
}
