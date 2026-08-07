import { getServerSession } from "next-auth";
import type { SavedSearch, Shortlist } from "@ipskill/shared";
import { authOptions } from "@/lib/auth";
import { listShortlists } from "@/lib/shortlists";
import { listSavedSearches } from "@/lib/saved-searches";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_SHORTLISTS, DEMO_SAVED_SEARCHES } from "@/lib/demo-data";
import { ShortlistsManager } from "@/components/shortlists-manager";

export default async function ShortlistsPage() {
  const session = await getServerSession(authOptions);
  const githubId = session!.githubId!;

  let shortlists: Shortlist[];
  let savedSearches: SavedSearch[];
  if (isDemoAccount(githubId)) {
    shortlists = DEMO_SHORTLISTS;
    savedSearches = DEMO_SAVED_SEARCHES;
  } else {
    try {
      [shortlists, savedSearches] = await Promise.all([
        listShortlists(githubId),
        listSavedSearches(githubId),
      ]);
    } catch {
      shortlists = [];
      savedSearches = [];
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-heading">Shortlists & Saved Searches</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Your recruiter-style tools for working the Directory: save candidates into named lists per
        role, and save filter combinations to re-run or get notified about.
      </p>

      <ShortlistsManager initialShortlists={shortlists} initialSavedSearches={savedSearches} />
    </div>
  );
}
