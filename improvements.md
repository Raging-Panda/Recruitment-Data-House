# Improvements Backlog

Ideas for the IPSkill Developer Hub beyond the current scaffold. Not
scheduled or scoped yet — just a running list to pull from.

## Requested

- **Skill tests** — ✅ shipped as a lightweight, in-house MCQ version
  (see the Verified Skills panel on the Skills page): timed
  multiple-choice tests per stack, scored server-side, shown as a
  separate signal alongside — not blended into — the GitHub-derived
  fingerprint. Deliberately not a real coding/execution sandbox; the
  plan is to migrate to a third-party assessment vendor (see below)
  once the app is earning revenue to justify the per-candidate cost.
- **Recent project history with GitHub** — ✅ shipped: a "Recent
  Activity" timeline on the Projects page merging commits/PRs/releases
  across the top 6 most active repos into one chronological feed, so
  it shows trajectory (ramping up, going quiet, switching stacks)
  rather than just the static snapshot the project list gives on its
  own.
- **Next position suggestions** — given a candidate's skill
  fingerprint and activity trend, surface role types/seniority levels
  they're likely a good fit for (e.g. "Senior Backend — Go/Postgres").
- **Developer directory with filters** — searchable list of devs,
  filterable by region, primary language, skill level, availability,
  and verification status. This is the recruiter-facing counterpart
  to the candidate-facing profile screens already built.
- **Profile view counter** — increment when a profile is opened, and
  again on sustained scroll/dwell (not just a page hit) so "Profile
  Views" on the Analytics screen becomes a real metric instead of the
  current derived placeholder.
- **SSO login with Google or GitHub** — GitHub OAuth already works;
  add a real Google sign-in option too (currently a disabled
  placeholder button on the login screen) so candidates without a
  GitHub-first workflow can still sign up.

## Additional ideas

- **GitLab / Bitbucket connectors** — extend the GitHub-only data
  source to cover SA enterprise/.NET devs who live on those
  platforms instead (already flagged as V2 in `PLAN.md`).
- **Recruiter shortlists & saved searches** — let recruiters save
  candidates into named lists per role, and save filter combinations
  as alerts that notify them when a new matching profile appears.
- **Peer/verified-engineer endorsements** — lightweight skill
  endorsements from other verified developers on the platform, as a
  human signal alongside the automated GitHub-derived fingerprint.
- **Shareable public profile link** — a candidate-controlled,
  revocable link (or PDF export) they can send directly to a client
  outside the platform, with an expiry and view-count on the link
  itself.
- **Contribution activity heatmap** — GitHub-style calendar heatmap
  on the profile, giving an at-a-glance consistency signal that's
  easier to scan than the weekly commit-count chart.
- **GitHub data caching/refresh layer** — cache aggregated GitHub API
  results (with periodic or webhook-triggered refresh) instead of
  recomputing language/PR/issue stats on every page load — needed
  before this scales past a handful of users, since the current
  scaffold hits GitHub's REST/Search API directly per request and
  will run into rate limits.
- **Recruiter-side profile engagement dashboard** — the inverse of
  the candidate's own Analytics screen: which of a recruiter's
  shortlisted/contacted candidates are most engaged, response rates,
  time-to-first-view after shortlisting, etc.
- **Skill freshness indicator** — flag when a listed skill hasn't
  shown up in recent activity (e.g. "Python — last used 2019") so the
  fingerprint reflects current ability, not just historical totals.
- **Verification badges on the public profile** — once the
  candidate-verification layer from `PLAN.md` exists, surface exactly
  which checks passed (ID, qualification, employment history) as
  visible badges, not just an internal status field.
- **Admin/moderation dashboard** — internal tooling for the IPSkill
  team to review flagged profiles, manage verification statuses, and
  handle reported abuse (referral fraud, duplicate accounts, etc.).

## Visual & UI polish

- **Loading states** — ✅ shipped on web: every data-fetching dashboard
  page (Profile, Skills, Projects, Analytics, Experience,
  Certifications) has a `loading.tsx` skeleton shaped like its real
  layout, via Next.js's automatic Suspense-boundary convention — the
  sidebar/topbar stay live, only the content area shows placeholders.
  Still open on mobile: a bare `ActivityIndicator` spinner is still
  what shows while GitHub data loads, plus a branded splash/loading
  screen on cold start.
- **Real icon set** — ✅ shipped: a shared line-icon set (outline style,
  matching the IPSkill brand's design system) now covers the web
  sidebar/topbar/nav and the mobile tab bar, replacing the emoji
  placeholders (🔔 🏠 🔍 💬 👤 📊) that used to be there. Still open:
  consistent active/inactive icon *states* beyond color (e.g. filled
  vs. outline variants), which the current set doesn't do yet.
- **Empty states with illustration + copy** — ✅ shipped: a shared
  EmptyState component (icon badge + title + actionable copy) now
  covers Projects, Skills' language breakdown, Verified Skills,
  Experience, Certifications, Recent Activity, and the
  Achievements/Settings stubs — replacing the old plain "No X yet"
  text.
- **Functional light mode** — the Dark Mode toggle in the web sidebar
  currently just flips visually without restyling anything; either
  wire up a real light theme or remove the toggle until it does.
- **Toasts/inline feedback** — confirm actions (login success, sign
  out, save) with toasts/snackbars instead of silent state changes.
- **Animated skill radar** — animate the radar chart filling in on
  first load and transitioning when the underlying data refreshes,
  rather than snapping straight to final values.
- **Design token audit** — the web (Tailwind config) and mobile
  (theme/index.ts) color/spacing tokens are hand-duplicated from
  `packages/shared`'s theme values; tighten this so both platforms
  visibly drift less over time as the palette evolves.
- **Actionable onboarding checklist** — turn the Profile Completion
  ring into a real checklist ("Connect GitHub ✓", "Add a bio",
  "Run a skill test") with links straight to the missing step, like
  LinkedIn's profile-completion nudges.

## Performance

- **Fewer GitHub round-trips** — move from sequential REST calls
  (languages per repo, separate search calls for PRs/issues) to
  GitHub's GraphQL API to pull profile + repos + languages + PR/issue
  counts in one or two requests instead of the current N+1 pattern.
- **Client-side data caching (mobile)** — replace the ad hoc
  `useEffect` fetch in `use-developer-hub-data.ts` with React
  Query/SWR so data is cached, revalidated in the background, and
  doesn't re-fetch from scratch on every screen focus.
- **Streaming/suspense on web** — use Next.js streaming so the
  dashboard shell (sidebar, topbar) renders immediately while GitHub
  data for the page body streams in, instead of blocking the whole
  route on `loadDeveloperHubData`.
- **Trim the skills bundle** — `recharts` alone accounts for ~94KB of
  the Skills page's first-load JS; either code-split it behind a
  dynamic import or swap it for a lighter/custom radar renderer like
  the one already built for mobile.
- **Virtualize long lists** — the web Projects page and the eventual
  developer directory should virtualize rows once candidate/repo
  counts grow past a page or two (mobile's `FlatList` already does
  this).

## New features

- **Real in-app messaging** — build out the Messages tab (currently a
  stub) so recruiters and candidates can actually talk without
  leaving the platform.
- **Push notifications (mobile)** — notify candidates on profile
  views, shortlist activity, and messages via Expo push
  notifications.
- **Candidate comparison view** — side-by-side skill fingerprints and
  stats for a recruiter's shortlisted candidates.
- **Real two-factor authentication** — the Account Security card
  currently shows "Two-Factor Authentication: Enabled" as static
  copy; wire up an actual TOTP/authenticator flow.
- **Export profile as PDF** — generate a client-shareable PDF summary
  of a candidate's verified profile and skill fingerprint (pairs well
  with the shareable-link idea above).
- **Role/job matching module** — connect candidate profiles to open
  client roles from the core ATS/CRM (once built) and surface match
  scores based on the skill fingerprint.
- **Free vs. Premium tiers** — define what's actually gated behind
  the "Upgrade to Pro" button already sitting in the web sidebar
  (currently just UI, not wired to anything). Needs: a concrete
  feature split (e.g. free = basic profile + GitHub skill
  fingerprint; premium = skill tests, PDF export, Growth Olympics
  eligibility, priority placement in the recruiter directory),
  subscription billing (Stripe is already available as a connector
  but not yet authorized in this environment), and a `plan` field on
  the user/profile model that every gated feature checks against.
- **Growth Olympics** — a monthly competition among premium users:
  whoever shows the biggest skill-fingerprint/activity growth over
  the month wins a prize (e.g. a R1000 Takealot voucher). Needs
  month-over-month snapshotting of each user's fingerprint/activity
  so "growth" is measurable, a leaderboard, a defined growth metric
  (which is fairest — overall score delta? weighted by category?),
  anti-gaming safeguards (e.g. against padding commit counts), and a
  way to actually fulfil the prize each month.
- **Referral program** — give existing users a personal referral
  link/code; when a referred candidate signs up (and maybe hits a
  milestone, like completing verification or connecting GitHub), both
  sides get a reward — e.g. free months of premium, or entries toward
  Growth Olympics. Needs referral attribution tracking, fraud/abuse
  limits (self-referrals, throwaway accounts), and a rewards ledger
  per user.
- **AI-generated candidate summary** — auto-generate a short,
  natural-language blurb from a candidate's GitHub signals ("Backend
  developer, 5 years active, strong in Go and Postgres, consistent
  weekly contributor") so recruiters can skim faster than reading raw
  stats.
- **Async video intro** — let candidates attach a short (60–90s)
  self-recorded intro video to their profile, giving recruiters a
  sense of communication style and personality alongside the
  code-derived signals.
- **Interview scheduling / calendar sync** — let recruiters send a
  booking link (Google Calendar/Outlook sync) so screening calls can
  be scheduled directly from a candidate's profile.
- **Salary/market-rate insights** — show a rough market rate range
  for a candidate's skill level and region, sourced from aggregated
  placement data over time, to help both sides set expectations early.
- **Public API for enterprise clients** — a scoped, authenticated API
  so larger clients can pull verified candidate/profile data into
  their own ATS instead of using the IPSkill UI directly.
- **Migrate skill tests to a third-party vendor** — once the app is
  earning revenue, replace/extend the in-house MCQ tests with a real
  proctored coding-assessment provider (CodeSignal, HackerRank for
  Work, Coderbyte) — actual code execution, larger question banks,
  anti-cheating. Design it as a provider interface behind the
  existing `/api/skill-tests` routes so the in-house tests and a
  vendor can coexist during the transition, rather than a rip-and-replace.
