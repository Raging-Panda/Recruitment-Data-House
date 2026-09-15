import "server-only";
import { randomBytes, createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

const PREFIX = "ipsk_";

function hash(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Returns the raw key exactly once — only the hash is stored, so this is
 * the only chance to see it (same UX as GitHub/Stripe API key creation). */
export async function createApiKey(ownerEmail: string, label: string): Promise<string> {
  const raw = PREFIX + randomBytes(24).toString("base64url");
  const { error } = await getSupabaseAdmin().from("api_keys").insert({
    key_hash: hash(raw),
    label,
    owner_email: ownerEmail,
  });
  if (error) throw new Error(error.message);
  return raw;
}

export interface ApiKeySummary {
  id: string;
  label: string;
  createdAt: string;
  revoked: boolean;
}

export async function listApiKeys(ownerEmail: string): Promise<ApiKeySummary[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("api_keys")
    .select("id, label, created_at, revoked")
    .eq("owner_email", ownerEmail)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, label: r.label, createdAt: r.created_at, revoked: r.revoked }));
}

export async function revokeApiKey(id: string, ownerEmail: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("api_keys")
    .update({ revoked: true })
    .eq("id", id)
    .eq("owner_email", ownerEmail);
  if (error) throw new Error(error.message);
}

export async function isValidApiKey(raw: string | null): Promise<boolean> {
  if (!raw || !raw.startsWith(PREFIX)) return false;
  const { data } = await getSupabaseAdmin()
    .from("api_keys")
    .select("revoked")
    .eq("key_hash", hash(raw))
    .maybeSingle();
  return Boolean(data && !data.revoked);
}
