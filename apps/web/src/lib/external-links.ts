import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";

export type ExternalLinkKind = "writing" | "talk" | "package" | "oss";

export interface ExternalLink {
  id: string;
  githubId: string;
  kind: ExternalLinkKind;
  title: string;
  url: string;
  description: string | null;
  sortOrder: number;
}

interface ExternalLinkRow {
  id: string;
  owner_id: string;
  kind: ExternalLinkKind;
  title: string;
  url: string;
  description: string | null;
  sort_order: number;
}

export const EXTERNAL_LINK_SELECT = "id, owner_id, kind, title, url, description, sort_order";

function rowToLink(row: ExternalLinkRow): ExternalLink {
  return {
    id: row.id,
    githubId: row.owner_id,
    kind: row.kind,
    title: row.title,
    url: row.url,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

const DEMO_LINKS: ExternalLink[] = [
  {
    id: "demo-link-1",
    githubId: "900000002",
    kind: "talk",
    title: "Idempotency at Scale — PaymentsConf 2025",
    url: "https://example.com/talk",
    description: "How we made retries safe across a distributed payments ledger.",
    sortOrder: 0,
  },
  {
    id: "demo-link-2",
    githubId: "900000002",
    kind: "package",
    title: "outbox-go",
    url: "https://pkg.go.dev/example.com/outbox-go",
    description: "A small Go library implementing the transactional outbox pattern.",
    sortOrder: 1,
  },
];

export async function getExternalLinks(githubId: string): Promise<ExternalLink[]> {
  if (isDemoAccount(githubId)) return DEMO_LINKS;
  const { data, error } = await getSupabaseAdmin()
    .from("external_links")
    .select(EXTERNAL_LINK_SELECT)
    .eq("owner_id", githubId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ExternalLinkRow[]).map(rowToLink);
}

export async function getExternalLinksSafe(githubId: string): Promise<ExternalLink[]> {
  try {
    return await getExternalLinks(githubId);
  } catch {
    return [];
  }
}
