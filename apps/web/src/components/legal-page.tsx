import type { ReactNode } from "react";
import { PublicFooter, PublicHeader } from "./public-chrome";
import { LEGAL_UPDATED } from "@/lib/legal";

/** Shared frame for /privacy and /terms: plain, readable prose. */
export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-heading">{title}</h1>
        <p className="mt-2 text-xs text-text-muted">Last updated {LEGAL_UPDATED}</p>
        <div className="mt-6 text-sm leading-relaxed text-text-secondary [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-heading [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-heading [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:text-heading [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          <p>{intro}</p>
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
