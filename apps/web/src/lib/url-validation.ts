/**
 * `new URL(x)` only checks that a string parses as *some* URL — it happily
 * accepts `javascript:alert(1)` or `data:text/html,<script>...</script>`,
 * both syntactically valid per the WHATWG URL spec. Every place a user
 * supplies a link that later gets rendered as a plain `<a href>` on a
 * profile page (skill proofs, external links, featured-project repo URLs)
 * needs the scheme itself restricted, not just parseability, or a stored
 * link becomes a stored XSS/phishing vector. http(s) only — every
 * legitimate use case here (a PR, a package registry, a talk recording, a
 * GitHub repo) is one of those two.
 */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
