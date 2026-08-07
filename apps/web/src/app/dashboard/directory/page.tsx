import { getServerSession } from "next-auth";
import type { DirectoryEntry, DirectoryFilters } from "@ipskill/shared";
import { authOptions } from "@/lib/auth";
import { getDirectoryEntries } from "@/lib/directory";
import { DirectoryBrowser } from "@/components/directory-browser";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_DIRECTORY_ENTRIES } from "@/lib/demo-data";
import { DEFAULT_DIRECTORY_FILTERS } from "@/lib/directory-filters";

interface DirectoryPageProps {
  searchParams: {
    search?: string;
    location?: string;
    language?: string;
    minScore?: string;
    availableOnly?: string;
  };
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const session = await getServerSession(authOptions);
  const githubId = session!.githubId!;

  let entries: DirectoryEntry[];
  if (isDemoAccount(githubId)) {
    entries = DEMO_DIRECTORY_ENTRIES;
  } else {
    try {
      entries = await getDirectoryEntries();
    } catch {
      entries = [];
    }
  }

  const others = entries.filter((entry) => entry.githubId !== githubId);

  // Populated when arriving from a saved search's "Run" link, so the
  // browser opens already filtered instead of requiring the recruiter to
  // re-enter the same criteria.
  const initialFilters: DirectoryFilters = {
    search: searchParams.search ?? DEFAULT_DIRECTORY_FILTERS.search,
    location: searchParams.location ?? DEFAULT_DIRECTORY_FILTERS.location,
    language: searchParams.language ?? DEFAULT_DIRECTORY_FILTERS.language,
    minScore: searchParams.minScore ? Number(searchParams.minScore) : DEFAULT_DIRECTORY_FILTERS.minScore,
    availableOnly: searchParams.availableOnly === "true",
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-heading">Developer Directory</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Browse other developers on IPSkill — the same recruiter-facing view clients see, minus the
        contact tools.
      </p>

      <DirectoryBrowser entries={others} initialFilters={initialFilters} />
    </div>
  );
}
