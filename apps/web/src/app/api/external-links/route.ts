import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { EXTERNAL_LINK_SELECT, type ExternalLinkKind } from "@/lib/external-links";
import { demoWriteBlockedResponse, isDemoAccount } from "@/lib/demo-mode";
import { isSafeHttpUrl } from "@/lib/url-validation";

const VALID_KINDS: ExternalLinkKind[] = ["writing", "talk", "package", "oss"];
const MAX_LINKS = 10;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isDemoAccount(session.githubId)) return demoWriteBlockedResponse();

  const body = await req.json().catch(() => null);
  const kind = body?.kind as ExternalLinkKind | undefined;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : null;

  if (!kind || !VALID_KINDS.includes(kind) || !title || !url) {
    return NextResponse.json({ error: "kind, title, and url are required" }, { status: 400 });
  }
  if (!isSafeHttpUrl(url)) {
    return NextResponse.json({ error: "url must be a valid http(s) URL" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("external_links")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", session.githubId);
  if ((count ?? 0) >= MAX_LINKS) {
    return NextResponse.json({ error: `You can add at most ${MAX_LINKS} links` }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("external_links")
    .insert({
      owner_id: session.githubId,
      kind,
      title,
      url,
      description: description || null,
      sort_order: count ?? 0,
    })
    .select(EXTERNAL_LINK_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    {
      entry: {
        id: data.id,
        githubId: data.owner_id,
        kind: data.kind,
        title: data.title,
        url: data.url,
        description: data.description,
        sortOrder: data.sort_order,
      },
    },
    { status: 201 }
  );
}
