import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoAccount } from "@/lib/demo-mode";

export interface PublicIdentity {
  handle: string | null;
  visibility: "private" | "public";
  company: string | null;
  videoIntroUrl: string | null;
}

const DEMO_IDENTITY: PublicIdentity = {
  handle: "naledi-demo",
  visibility: "public",
  company: "Yoco",
  videoIntroUrl: null,
};

const EMPTY_IDENTITY: PublicIdentity = { handle: null, visibility: "private", company: null, videoIntroUrl: null };

export async function getPublicIdentity(githubId: string): Promise<PublicIdentity> {
  if (isDemoAccount(githubId)) return DEMO_IDENTITY;
  const { data, error } = await getSupabaseAdmin()
    .from("candidate_profile")
    .select("handle, visibility, company, video_intro_url")
    .eq("github_id", githubId)
    .maybeSingle();
  if (error || !data) return EMPTY_IDENTITY;
  return {
    handle: data.handle,
    visibility: (data.visibility as "private" | "public") ?? "private",
    company: data.company,
    videoIntroUrl: data.video_intro_url,
  };
}

export async function getPublicIdentitySafe(githubId: string): Promise<PublicIdentity> {
  try {
    return await getPublicIdentity(githubId);
  } catch {
    return EMPTY_IDENTITY;
  }
}
