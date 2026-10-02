import { isDemoAccount } from "@/lib/demo-mode";

/** Admins are an explicit allowlist of GitHub ids in ADMIN_GITHUB_IDS
 * (comma-separated) — no role column to escalate into, and an unset env
 * means nobody is an admin. The shared demo account can never be one. */
export function isAdmin(githubId: string | null | undefined): boolean {
  if (!githubId || isDemoAccount(githubId)) return false;
  const allowed = (process.env.ADMIN_GITHUB_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(githubId);
}
