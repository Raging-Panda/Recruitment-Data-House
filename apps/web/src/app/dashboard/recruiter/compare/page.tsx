import { getServerSession } from "next-auth";
import type { DirectoryEntry } from "@ipskill/shared";
import { authOptions } from "@/lib/auth";
import { getDirectoryEntriesByIds } from "@/lib/directory";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_DIRECTORY_ENTRIES } from "@/lib/demo-data";
import { CompareTable } from "@/components/compare-table";
import { EmptyState } from "@/components/empty-state";
import { BarChartIcon } from "@/components/icons";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const session = await getServerSession(authOptions);
  const githubId = session!.githubId!;

  const ids = (searchParams.ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);

  let candidates: DirectoryEntry[];
  if (isDemoAccount(githubId)) {
    candidates = DEMO_DIRECTORY_ENTRIES.filter((e) => ids.includes(e.githubId));
  } else {
    try {
      candidates = await getDirectoryEntriesByIds(ids);
    } catch {
      candidates = [];
    }
  }

  // Preserve the order the recruiter selected them in, not insertion/query order.
  candidates.sort((a, b) => ids.indexOf(a.githubId) - ids.indexOf(b.githubId));

  return (
    <div>
      <h1 className="text-2xl font-bold text-heading">Compare Candidates</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Side-by-side skill fingerprints, languages, and availability.
      </p>

      {candidates.length < 2 ? (
        <EmptyState
          className="mt-6"
          icon={BarChartIcon}
          title="Select 2-4 candidates to compare"
          description="Use the circle-select button on a Directory or Shortlist card, then click Compare."
        />
      ) : (
        <CompareTable candidates={candidates} />
      )}
    </div>
  );
}
