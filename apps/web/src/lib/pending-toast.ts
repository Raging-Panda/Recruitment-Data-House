const STORAGE_KEY = "ipskill-pending-toast";

type Variant = "success" | "error";

/**
 * A toast fired right before a full-page redirect (sign-in via GitHub OAuth,
 * sign-out) would just disappear with the navigation. Stash it in
 * sessionStorage instead — it survives the redirect (same tab, same origin
 * on return) — and read it once on the page that lands after.
 */
export function setPendingToast(message: string, variant: Variant = "success"): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ message, variant }));
  } catch {
    // sessionStorage can throw in locked-down browser contexts — the toast is a nicety, not worth crashing over
  }
}

export function consumePendingToast(): { message: string; variant: Variant } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
