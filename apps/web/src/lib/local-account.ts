/** Prefix for a regular (email/password) account's synthetic app identity,
 * mirroring the "google:<sub>" convention from Google sign-in — see the
 * jwt callback in lib/auth.ts. Kept in its own file (rather than inline in
 * auth.ts) since lib/linked-accounts.ts will need it too once account
 * linking is built. */
export const LOCAL_ID_PREFIX = "local:";

export function isLocalAccountId(id: string | null | undefined): boolean {
  return Boolean(id?.startsWith(LOCAL_ID_PREFIX));
}
