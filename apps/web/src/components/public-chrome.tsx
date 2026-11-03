import Link from "next/link";
import { IPSkillLogo } from "./ipskill-logo";
import { buttonClass } from "@/lib/button-styles";
import { COMPANY_NAME, LEGAL_EMAIL } from "@/lib/legal";

/** Header for the signed-out pages: home, privacy and terms. */
export function PublicHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
      <Link href="/" className="flex items-center gap-2">
        <IPSkillLogo size={30} />
        <span className="text-base font-extrabold text-heading">IPSkill</span>
      </Link>
      <nav className="flex items-center gap-1 sm:gap-3">
        <Link href="/directory" className="px-2 py-1.5 text-sm text-text-secondary transition hover:text-heading">
          Discover
        </Link>
        <Link href="/login" className={buttonClass("primary", "md")}>
          Sign in
        </Link>
      </nav>
    </header>
  );
}

/** The privacy policy and terms have to be reachable from every page a
 * visitor can sign in or browse from — POPIA expects people to be told
 * how their data is used before they hand it over. */
export function PublicFooter() {
  return (
    <footer className="border-t border-surface-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-text-muted sm:flex-row">
        <p>
          © {new Date().getFullYear()} {COMPANY_NAME}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/directory" className="hover:text-heading">
            Discover
          </Link>
          <Link href="/privacy" className="hover:text-heading">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-heading">
            Terms
          </Link>
          <a href={`mailto:${LEGAL_EMAIL}`} className="hover:text-heading">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
