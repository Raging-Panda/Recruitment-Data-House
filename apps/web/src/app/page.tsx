import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { buttonClass } from "@/lib/button-styles";
import { buildDemoDeveloperHubData } from "@/lib/demo-data";
import { V1_MODE } from "@/lib/v1-mode";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";
import { DemoButton } from "@/components/demo-button";
import { PendingToastOnMount } from "@/components/pending-toast-on-mount";
import { FingerprintPattern } from "@/components/fingerprint-pattern";
import { ScoreRing } from "@/components/score-ring";
import { SkillRadarChartLazy } from "@/components/skill-radar-chart-lazy";
import { BriefcaseIcon, CodeIcon, EyeIcon, LayersIcon, SearchIcon, ShieldCheckIcon, UsersIcon } from "@/components/icons";

const STEPS = [
  {
    title: "Sign in with GitHub",
    body: "IPSkill reads your public profile and public repositories. Never your private code.",
  },
  {
    title: "Get your skill fingerprint",
    body: "Your languages, commits and projects become a scored fingerprint. Add your experience and certifications in your own words.",
  },
  {
    title: "Share it",
    body: "Switch on your public page for a link of your own, or send a private link that expires.",
  },
];

const DEV_FEATURES: { icon: typeof CodeIcon; title: string; body: string; v1?: false }[] = [
  {
    icon: CodeIcon,
    title: "A fingerprint, not a keyword list",
    body: "Scored across backend, frontend, databases, DevOps, cloud and more, from the work you've actually shipped.",
  },
  {
    icon: BriefcaseIcon,
    title: "Projects that speak for you",
    body: "Pin the repositories you're proudest of and say what they do and why they matter.",
  },
  {
    icon: LayersIcon,
    title: "Your whole career in one place",
    body: "Work history, certifications, links to your writing and talks, and a short video intro.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Skill tests",
    body: "Timed tests from entry level up, so a pass means something.",
    v1: false,
  },
  {
    icon: EyeIcon,
    title: "You choose what's public",
    body: "Your public page stays off until you switch it on, and you can hide it again at any time.",
  },
];

/** Signed-out visitors land here; signed-in ones go straight to their profile. */
export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard/profile");
  }

  const example = buildDemoDeveloperHubData();
  const topLanguages = example.activity.languageBreakdown.slice(0, 4).map((l) => l.language);
  const initials = example.profile.name
    .split(" ")
    .map((part) => part[0])
    .join("");
  const features = DEV_FEATURES.filter((f) => !(V1_MODE && f.v1 === false));

  return (
    <div className="min-h-screen bg-background">
      <PendingToastOnMount />
      <PublicHeader />

      <main>
        <section className="relative overflow-hidden">
          <FingerprintPattern />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-10 md:grid-cols-2 md:pb-24 md:pt-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Unique Skills, Perfect Match.</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-heading sm:text-5xl">
                Show what you can actually build.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-text-secondary">
                IPSkill turns your GitHub work into a developer profile you can share with one link: your skill
                fingerprint, the projects behind it, and the career around it. Free for developers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login" className={buttonClass("primary", "lg", "px-6")}>
                  Get started
                </Link>
                <DemoButton className={buttonClass("outline", "lg", "px-6")} />
              </div>
            </div>

            <div className="mx-auto w-full max-w-md">
              <div className="rounded-2xl border border-surface-border bg-background-elevated p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div
                    aria-hidden
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-gradient text-lg font-bold text-white"
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-heading">{example.profile.name}</p>
                    <p className="truncate text-sm text-text-secondary">
                      {example.profile.headline} · {example.profile.location}
                    </p>
                  </div>
                  <ScoreRing score={example.profile.overallScore} label="Overall" />
                </div>
                <SkillRadarChartLazy fingerprint={example.skillFingerprint} />
                <div className="mt-2 flex flex-wrap gap-2">
                  {topLanguages.map((language) => (
                    <span key={language} className="rounded-full bg-surface px-3 py-1 text-xs text-text-secondary">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-text-muted">An example profile, from the demo.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-surface-border bg-background-elevated/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-2xl font-bold text-heading">How it works</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-2xl border border-surface-border bg-background p-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-heading">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-heading">For developers</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            A CV says what you claim. Your profile shows what you've done.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-surface-border bg-background-elevated p-5">
                <span className="text-primary">
                  <Icon size={20} />
                </span>
                <h3 className="mt-3 font-semibold text-heading">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid gap-8 rounded-3xl border border-surface-border bg-background-elevated p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <SearchIcon size={18} />
                <UsersIcon size={18} />
              </div>
              <h2 className="mt-3 text-2xl font-bold text-heading">For recruiters</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                Search developers by what they can do, compare candidates side by side, keep shortlists, and propose
                interviews. Recruiter Tools is invite-only while IPSkill launches: sign in, then request access from
                the Recruiter Tools card.
              </p>
            </div>
            <Link href="/login" className={buttonClass("white", "lg", "px-6")}>
              Sign in to request access
            </Link>
          </div>
        </section>

        <section className="border-t border-surface-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center">
            <h2 className="text-2xl font-bold text-heading">Your work already says a lot.</h2>
            <p className="mt-2 text-sm text-text-secondary">Give it somewhere to say it.</p>
            <Link href="/login" className={buttonClass("primary", "lg", "mt-6 px-8")}>
              Create your profile
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
