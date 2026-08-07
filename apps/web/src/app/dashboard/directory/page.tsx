import { getServerSession } from "next-auth";
import type { DirectoryEntry } from "@ipskill/shared";
import { authOptions } from "@/lib/auth";
import { getDirectoryEntries } from "@/lib/directory";
import { DirectoryBrowser } from "@/components/directory-browser";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_DIRECTORY_ENTRIES } from "@/lib/demo-data";

export default async function DirectoryPage() {
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

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-heading">Developer Directory</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Browse other developers on IPSkill — the same recruiter-facing view clients see, minus the
        contact tools.
      </p>

      <DirectoryBrowser entries={others} />
    </div>
  );
}
