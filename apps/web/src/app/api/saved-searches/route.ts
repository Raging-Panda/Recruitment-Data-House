import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { DirectoryFilters } from "@ipskill/shared";
import { authOptions } from "@/lib/auth";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { listSavedSearches, createSavedSearch } from "@/lib/saved-searches";
import { DEFAULT_DIRECTORY_FILTERS } from "@/lib/directory-filters";
import { DEMO_SAVED_SEARCHES } from "@/lib/demo-data";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) {
    return NextResponse.json({ savedSearches: DEMO_SAVED_SEARCHES });
  }

  try {
    const savedSearches = await listSavedSearches(session.githubId);
    return NextResponse.json({ savedSearches });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load saved searches" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const filters: DirectoryFilters = { ...DEFAULT_DIRECTORY_FILTERS, ...(body?.filters ?? {}) };

  try {
    const savedSearch = await createSavedSearch(session.githubId, name, filters);
    return NextResponse.json({ savedSearch }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save search" },
      { status: 500 }
    );
  }
}
