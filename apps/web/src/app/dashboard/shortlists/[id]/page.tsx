import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getShortlistWithCandidates } from "@/lib/shortlists";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_SHORTLISTS_WITH_CANDIDATES } from "@/lib/demo-data";
import { ShortlistCandidateGrid } from "@/components/shortlist-candidate-grid";
import type { ShortlistWithCandidates } from "@ipskill/shared";

export default async function ShortlistDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const githubId = session!.githubId!;

  let shortlist: ShortlistWithCandidates | null;
  if (isDemoAccount(githubId)) {
    shortlist = DEMO_SHORTLISTS_WITH_CANDIDATES.find((s) => s.id === params.id) ?? null;
  } else {
    try {
      shortlist = await getShortlistWithCandidates(githubId, params.id);
    } catch {
      shortlist = null;
    }
  }

  if (!shortlist) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard/shortlists" className="text-sm text-text-secondary hover:text-heading">
        ← Back to Shortlists
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-heading">{shortlist.name}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {shortlist.candidateCount} candidate{shortlist.candidateCount === 1 ? "" : "s"}
      </p>

      <ShortlistCandidateGrid shortlistId={shortlist.id} initialCandidates={shortlist.candidates} />
    </div>
  );
}
