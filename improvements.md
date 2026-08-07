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
  **Difficulty tiers scaffolded, content not yet written**: a 9-tier
  ladder (Beginner 1-3, Intermediate 1-3, Advanced 1-3) exists as
  `is_active=false` placeholder rows across 16 skills (Python, Go,
  Vue, C#, AWS, Azure, JavaScript/TypeScript, SQL, Docker &
  Kubernetes, Java, Acumatica, HubSpot, ClickUp, HTML, CSS, PHP) —
  144 template rows total, each tagged with a `target_question_count`
  (5 at Beginner 1 up to 9 at Advanced 3) as a guide for whoever
  writes the actual questions. The original 3 single-tier
  "Fundamentals" tests (JavaScript, Python, SQL) stay active until
  replaced by their leveled equivalents, so Verified Skills isn't
  empty in the meantime. Next step: author real questions per
  tier/skill, then flip `is_active` on as each is ready.
- **Recent project history with GitHub** — ✅ shipped: a "Recent
  Activity" timeline on the Projects page merging commits/PRs/releases
  across the top 6 most active repos into one chronological feed, so
  it shows trajectory (ramping up, going quiet, switching stacks)
  rather than just the static snapshot the project list gives on its
  own.
- **Next position suggestions** — ✅ shipped: the Analytics page now
  surfaces a "Next Position Suggestions" card with a primary role
  (e.g. "Staff Backend Engineer"), a match %, a top-language stack tag,
  and up to two alternates (including "Engineering Lead" when
  leadership + a strong domain both score highly). Deliberately
  deterministic/rule-based rather than an AI/Gemini call — domain
  scores come straight from the skill fingerprint, seniority blends
  years of work experience (when available) with overall score and a
  project-quality ratio (tests/CI/README/license across repos), and it
  degrades gracefully to GitHub-only signals when no work experience is
  on file. Verified on both the demo account (rich data → "Staff
  Backend Engineer", 92% match) and the test account (no work
  experience → correct Mid-Level fallback with an explicit "add work
  experience for a more precise read" rationale line). Replaces the old
  "AI Career Recommendations" placeholder.
- **Developer directory with filters** — ✅ shipped: a searchable
  Developer Directory (location, primary language, minimum skill
  score, availability), with a read-only detail view per developer —
  the recruiter-facing counterpart to the candidate-facing profile
  screens. Entries are a cached snapshot (`directory_profiles`,
  refreshed whenever a candidate visits their own Profile page), not a
  live GitHub fetch, since we only ever hold the signed-in user's own
  access token. **Update:** now lives inside the premium-gated
  Recruiter Tools section (`/dashboard/recruiter/*`) rather than being
  open to every signed-in dev — see "Recruiter Tools is now a separate
  premium section" below. Still open: no verification-status filter
  yet (waiting on the candidate-verification layer from `PLAN.md`).
- **Profile view counter** — ✅ shipped (page-hit version): opening a
  developer's directory entry records a real `profile_views` row
  (self-views excluded), and the Analytics screen's "Profile Views"
  stat now reads actual counts and a genuine month-over-month change%
  instead of the derived placeholder. Still open: the sustained
  scroll/dwell signal — this only counts a view on page open, not
  engaged reading time.
- **SSO login with Google or GitHub** — GitHub OAuth already works;
  add a real Google sign-in option too (currently a disabled
  placeholder button on the login screen) so candidates without a
  GitHub-first workflow can still sign up.

## Additional ideas

- **GitLab / Bitbucket connectors** — extend the GitHub-only data
  source to cover SA enterprise/.NET devs who live on those
  platforms instead (already flagged as V2 in `PLAN.md`).
- **Recruiter shortlists & saved searches** — ✅ shipped: a new
  Shortlists page (`shortlists`, `shortlist_candidates`,
  `saved_searches`, `saved_search_matches` tables) lets any signed-in
  user bookmark Directory candidates into named lists (via a bookmark
  button on each card, with inline "create a new list" support) and
  save the current Directory filter combination by name. Saved
  searches have a "Run" link that deep-links back into the Directory
  with those filters pre-applied (`DirectoryBrowser` now accepts
  `initialFilters`, parsed from the Directory page's URL query
  params). The matching/notify half is real, not just a re-run
  button: whenever a candidate's directory profile syncs (on their own
  Profile page visit), `notifySavedSearchMatches` checks every other
  user's saved searches with the exact same filter logic the browser
  uses (`matchesDirectoryFilters`, extracted once and shared by both),
  and creates a notification for the owner of each newly-matching
  search — a `saved_search_matches` dedupe ledger (unique on
  `(saved_search_id, candidate_github_id)`) means a candidate
  revisiting their own profile never re-notifies the same recruiter
  twice for the same match. Demo account shows two canned shortlists
  and two canned saved searches (read-only, writes correctly 403
  "shared demo account" like every other demo write path). Verified
  end-to-end via Playwright: bookmark → create-list → shortlist detail
  page → saved-search "Run" → correct filtered Directory results.
  Still open: no "already in this shortlist" checkmark on the Directory
  card itself, and no bulk actions (export shortlist, remove-all).
  **Update:** now lives inside the premium-gated Recruiter Tools
  section — see below.
- **Recruiter Tools is now a separate premium section** — ✅ shipped:
  the Directory, Shortlists/Saved Searches, and the new Compare view
  (next bullet) were pulled out of the standard dev-profile sidebar
  entirely and moved under `/dashboard/recruiter/*`, gated by a single
  layout (`app/dashboard/recruiter/layout.tsx`) that renders a paywall
  screen in place of the section for anyone without recruiter access.
  It's reached from one dedicated sidebar card ("Recruiter Tools")
  rather than being nav items mixed in with Profile/Skills/Projects —
  clicking it either opens the section or shows "Upgrade Now".
  **There is no real payment processor wired up yet** (Stripe is
  available as a connector but not authorized in this environment).
  Plans are a `plan` column (`free` | `premium_dev` |
  `premium_recruiter`) on `candidate_profile` — see the next bullet
  for why it's two premium tiers and not one boolean. Real accounts
  self-serve straight to `premium_recruiter` via `/api/premium/upgrade`
  (a stub — swapping in real billing is exactly the "Free vs. Premium
  tiers" item further down). The demo account is always
  `premium_recruiter` (public showcase always shows the full product).
- **Test-only plan toggle** — ✅ shipped: the dev-only test account
  (`ALLOW_TEST_LOGIN`) gets a "Test Plan" widget in the sidebar with
  three buttons — Free / Premium Dev / Premium Recruiter — calling a
  new `/api/premium/set-plan` route that's rejected (403) for every
  other account, including demo, so it can never become a real-user
  "set your own plan for free" backdoor. This exists because the real
  self-serve upgrade flow is one-directional (free → premium_recruiter
  only) and can't reach `premium_dev` at all, but QA needs to cycle
  through all three states — including back down to free — to verify
  every gate without real billing. This is also why the plan model has
  two premium tiers instead of one: Premium Dev is reserved for future
  candidate-side perks (not wired to anything gated yet — see "Free
  vs. Premium tiers"), Premium Recruiter is the only one that unlocks
  Recruiter Tools, and they're deliberately not hierarchical (Premium
  Dev alone does not also grant recruiter access). Verified via
  Playwright: demo account shows no Test Plan widget at all; test
  account shows it defaulting to Free (paywalled), and clicking each
  plan button correctly calls the route (fails gracefully with a toast
  in this sandbox specifically because outbound Supabase calls aren't
  allow-listed here — not an app bug); a demo-account request straight
  to `/api/premium/set-plan` correctly 403s.
- **Peer/verified-engineer endorsements** — ✅ shipped: a new
  `endorsements` table (endorser/endorsee/skill_category/comment,
  unique per endorser+endorsee+skill, self-endorsement blocked by a
  DB check constraint) backs a lightweight "endorse a skill category"
  flow: from a candidate's Directory detail page, any other signed-in
  dev can endorse one of their skill categories with an optional
  comment. Endorsements show up read-only on the endorsee's own
  Profile page and on their Directory detail page, and fire a
  notification (`endorsement_received`) to the endorsee. Endorser
  display info (name/avatar) is resolved from `directory_profiles` at
  read time rather than stored on the row, so it stays current and
  degrades to "A verified developer" if the endorser has no directory
  snapshot yet. "Verified" here just means "another real signed-in
  account" — there's no separate identity-verification layer yet (see
  `PLAN.md`). Because giving an endorsement currently rides on the
  Directory detail page, it inherits that page's premium-recruiter
  gate — genuinely open peer endorsement (any dev endorsing any other
  dev, not just recruiters browsing the Directory) isn't possible
  until candidates can view each other's profiles outside Recruiter
  Tools. Demo account: read-only, two canned endorsements (on the demo
  persona and on one seed candidate); the endorse form is hidden
  entirely for demo (can't write). Verified via Playwright.
- **Shareable public profile link** — ✅ shipped: a new
  `public_profile_links` table (one row per candidate, a `token` uuid
  swapped on regenerate, `expires_at`, `revoked`, `view_count`) backs a
  "Share Your Profile" card on the Profile page — Generate, Regenerate
  (old link stops working immediately), and Revoke, plus a live view
  count and expiry date (90 days, reset on regenerate). The link
  itself (`/p/[token]`) is a genuinely unauthenticated route outside
  `/dashboard` — no login, no session — rendering the same read-only
  view a recruiter sees on the Directory detail page (avatar, headline,
  score, skill fingerprint, top languages, availability, endorsements),
  looked up straight from the `directory_profiles` snapshot. An
  invalid, revoked, or expired token all 404 identically, on purpose —
  a dead link shouldn't hint at why. View-count increments are a
  best-effort read-then-write, not atomic — acceptable for a low-
  traffic share-link counter, same tradeoff as the rest of the app's
  view tracking. PDF export (the alternative this bullet originally
  offered) is still a separate open item below. Demo account shows a
  read-only canned link; verified via Playwright that Regenerate/Revoke
  are genuinely disabled for it, and that an invalid token 404s.
- **Contribution activity heatmap** — GitHub-style calendar heatmap
  on the profile, giving an at-a-glance consistency signal that's
  easier to scan than the weekly commit-count chart.
- **GitHub data caching/refresh layer** — ✅ shipped: `loadDeveloperHubData`
  and `loadProjectActivityTimeline` are now read-through cached in a
  new `github_data_cache` table (`lib/github-cache.ts`), keyed by
  `<github_id>:<kind>`. Before this, every one of the four dashboard
  pages (Profile, Skills, Projects, Analytics) independently triggered
  the full GitHub fan-out on its own — up to ~30 REST/Search calls for
  the hub summary (`/user`, `/user/repos`, per-repo languages, PR/issue
  search, events) plus ~18 more for the Projects timeline
  (commits/PRs/releases across 6 repos) — meaning simply clicking
  between dashboard pages repeatedly re-paid that cost per user. Hub
  data gets a 10-minute TTL (feels stale fastest — skills/score change
  often), the timeline gets 30 minutes (much more expensive to rebuild,
  less need to be second-to-second fresh). A cache miss/expiry falls
  through to a live fetch and repopulates the row; any Supabase error
  degrades to a live fetch rather than breaking the page. Demo/test
  accounts bypass the cache entirely since they never hit GitHub.
  Still open: no manual "refresh now" action yet, and this is still
  per-request REST calls on a miss rather than GraphQL batching (see
  "Fewer GitHub round-trips" below) — the cache reduces call *volume*,
  it doesn't reduce the cost of a single cold fetch.
- **Recruiter-side profile engagement dashboard** — ✅ shipped: a new
  "Engagement" tab in Recruiter Tools (`/dashboard/recruiter/engagement`,
  `lib/recruiter-engagement.ts`) is the inverse of the candidate's own
  Analytics screen — for the signed-in recruiter, it shows every
  candidate across all their shortlists with view count, first/last
  viewed date, and time-to-first-view after shortlisting, plus summary
  stat tiles (total shortlisted, % viewed at least once, average time
  to first view). Built entirely from data already tracked —
  `shortlist_candidates.added_at` joined against `profile_views` rows
  where the recruiter is the viewer — no new tables needed. Still
  open: "response rates" from the original ask can't exist until real
  in-app messaging replaces the current "contacting isn't wired up
  yet" placeholder, since there's no "contacted" event to measure a
  response against. Verified via Playwright against demo fixture data
  (4 shortlisted candidates, 3 viewed, 75%, 11h avg time-to-first-view
  — all matching the seeded numbers).
- **Skill freshness indicator** — ✅ shipped: `buildLanguageBreakdown`
  now tracks, per language, the most recent `updated_at` among repos
  containing it (a repo-level proxy for "last used" — GitHub doesn't
  expose per-language commit dates cheaply), exposed as
  `LanguageBreakdownEntry.lastUsedAt`. The Skills page's Language
  Breakdown now shows a caption per language
  (`lib/analysis.ts`'s `describeSkillFreshness`) — "Used this month",
  "Last used N months ago", or, once past a year, an amber ⚠ "Last
  used 2024 — 1 yr ago" warning so the fingerprint reads as current
  ability, not historical totals. Verified via Playwright with a
  deliberately-stale fixture (Terraform, ~600 days) correctly flagged
  while fresher languages show plain unstyled captions.
- **Verification badges on the public profile** — once the
  candidate-verification layer from `PLAN.md` exists, surface exactly
  which checks passed (ID, qualification, employment history) as
  visible badges, not just an internal status field.
- **Admin/moderation dashboard** — internal tooling for the IPSkill
  team to review flagged profiles, manage verification statuses, and
  handle reported abuse (referral fraud, duplicate accounts, etc.).

## Visual & UI polish

- **Loading states** — ✅ shipped on both platforms. Web: every
  data-fetching dashboard page (Profile, Skills, Projects, Analytics,
  Experience, Certifications) has a `loading.tsx` skeleton shaped like
  its real layout, via Next.js's automatic Suspense-boundary
  convention — the sidebar/topbar stay live, only the content area
  shows placeholders. Mobile: added a `BrandedLoadingScreen` (logo +
  spinner) replacing the bare `ActivityIndicator` on Profile and
  Analytics' full-page loads, and used it to fix a real bug along the
  way — `App.tsx` ignored `useAuth()`'s `isLoading` entirely, so a
  returning signed-in user briefly flashed the login screen every cold
  start while the stored token loaded from SecureStore.
- **Real icon set** — ✅ shipped: a shared line-icon set (outline style,
  matching the IPSkill brand's design system) now covers the web
  sidebar/topbar/nav and the mobile tab bar, replacing the emoji
  placeholders (🔔 🏠 🔍 💬 👤 📊) that used to be there. Active/inactive
  *states* beyond color are also shipped on web now (see below) —
  mobile's tab bar still only differs by tint color, no filled/outline
  distinction yet.
- **Empty states with illustration + copy** — ✅ shipped: a shared
  EmptyState component (icon badge + title + actionable copy) now
  covers Projects, Skills' language breakdown, Verified Skills,
  Experience, Certifications, Recent Activity, and the
  Achievements/Settings stubs — replacing the old plain "No X yet"
  text.
- **Functional light mode** — ✅ shipped on both platforms. Web: the
  Dark Mode toggle actually restyles the app. Structural tokens
  (background, surfaces, borders, text) flip via CSS variables + a
  `[data-theme]` attribute; brand/accent colors stay constant across
  both themes by design. Persists to localStorage with a
  before-hydration script to avoid a flash of the wrong theme. Mobile:
  a `ThemeProvider` (persisted via `expo-secure-store`, reusing
  `packages/shared`'s `lightColors` for the light palette) with a
  sun/moon toggle on the Profile screen. Since React Native has no CSS
  variables, every screen's `StyleSheet.create` call became a
  `createStyles(colors)` function invoked per-render instead of a
  static module-level object — a bigger refactor than web's version,
  since the styles themselves needed to become reactive, not just the
  values they reference.
- **Toasts/inline feedback** — ✅ shipped, including login/logout: a
  ToastProvider (bottom-right stack, auto-dismiss) confirms Experience
  and Certifications save/delete, the profile display-name edit, and
  now sign-in/sign-out too. The latter two survive their full-page
  redirects via a small `lib/pending-toast.ts` helper — the message is
  stashed in sessionStorage right before the redirect and consumed
  once by whichever page mounts next (DashboardShell for sign-in,
  LoginCard for sign-out), rather than firing right before navigation
  and immediately vanishing.
- **Animated skill radar** — ✅ shipped: each of the 8 skill points
  extends individually in a staggered wave (100ms offset, ease-out)
  rather than the whole polygon tweening as one uniform shape, driven
  by a manual requestAnimationFrame loop instead of recharts' built-in
  animation. Re-triggers correctly whenever the `fingerprint` prop
  changes, not just on first mount.
- **Design token audit** — ✅ shipped: found two real gaps and fixed
  both. Web's `globals.css` hand-duplicated every dark/light color as
  separate RGB-triplet CSS custom properties — now generated at
  render time in `layout.tsx` from `packages/shared`'s `colors`/
  `lightColors` via a `hexToRgbTriplet` helper, so there's exactly one
  place these values are ever written (verified byte-identical output
  before/after). Mobile's `theme/index.ts` retyped `spacing`/`radii`
  literals that already existed in `packages/shared` (and had quietly
  drifted — missing the `xxl` step) instead of importing them; now
  imports directly. One accepted exception: `apps/mobile/app.json`'s
  splash/background color has to stay a literal hex, since Expo's
  static JSON manifest can't import from a TS package.
- **Actionable onboarding checklist** — ✅ shipped: the Profile
  Completion ring is now driven by a real six-item checklist (Connect
  GitHub, set a display name, add a GitHub bio, add work experience,
  add a certification, run a skill test), rendered below the ring with
  each unfinished item linking straight to where to complete it. Fixes
  a pre-existing bug in the process — the ring was previously showing
  the GitHub skill-fingerprint average mislabeled as "Profile
  Completion," a number unrelated to actual profile completeness.
- **Mobile-responsive web dashboard** — ✅ shipped: the shell was
  desktop-only (a permanent 256px sidebar, an 80-wide search bar, zero
  responsive breakpoints on most pages). The sidebar is now an
  off-canvas drawer below 1024px, opened via a hamburger button in the
  topbar with a backdrop and auto-close on navigation; row-style cards
  (Projects, Verified Skills, Experience, Certifications) stack
  vertically below `sm` instead of squeezing a title and action
  buttons into one row. Verified at 375/768/1280px with no horizontal
  overflow at any width.
- **Working notification bell** — ✅ shipped: the topbar bell was a
  static icon with a permanent unread dot and no click behavior. Now
  backed by a real `notifications` table (same RLS/service-role
  pattern as the other candidate tables) — a dropdown shows an actual
  unread count, mark-one/mark-all as read, and click-to-navigate.
  Notifications are generated by genuine events (adding experience,
  adding a certification, completing a skill test) rather than
  fabricated activity. Still open: no notifications yet for things
  outside the candidate's own actions (e.g. a recruiter viewing their
  profile), since there's no recruiter-side activity to notify about
  until that half of the platform exists.

## Performance

- **Fewer GitHub round-trips** — move from sequential REST calls
  (languages per repo, separate search calls for PRs/issues) to
  GitHub's GraphQL API to pull profile + repos + languages + PR/issue
  counts in one or two requests instead of the current N+1 pattern.
- **Client-side data caching (mobile)** — replace the ad hoc
  `useEffect` fetch in `use-developer-hub-data.ts` with React
  Query/SWR so data is cached, revalidated in the background, and
  doesn't re-fetch from scratch on every screen focus.
- **Streaming/suspense on web** — ✅ mostly already shipped, now
  extended: the shell-vs-body split this item describes already exists
  for every GitHub-data-heavy route (Profile, Skills, Projects,
  Analytics) via each route's `loading.tsx` — Next's automatic
  per-segment Suspense boundary — see "Loading states" above, which is
  the same mechanism under a different heading. What this pass added
  is *finer-grained* streaming *within* a page: the Analytics page's
  two sections that need an extra fetch beyond the core
  `loadDeveloperHubData` result (Next Position Suggestions needs
  `work_experience`; the Profile Views stat needs `profile_views`) are
  now separate async Server Components
  (`NextPositionSuggestionsSection`, `ProfileViewsStat`) each in their
  own `<Suspense>` with a lightweight skeleton fallback, so the rest of
  the page — radar chart, category breakdown, strengths/gaps, growth
  trend — no longer waits on those two extra round trips to appear.
  Verified via Playwright that both sections still render correctly
  under Suspense.
- **Trim the skills bundle** — ✅ shipped: `SkillRadarChart` and
  `CommitTrendChart` (both recharts-backed) are now lazy-loaded via
  `next/dynamic` wrapped in small Client Components
  (`skill-radar-chart-lazy.tsx`, `commit-trend-chart-lazy.tsx`) with
  `ssr: false` and a skeleton fallback. The first attempt — calling
  `next/dynamic` directly inside the Server Component pages — compiled
  fine but didn't actually shrink anything, because Next disallows
  `ssr: false` in a Server Component, and `ssr: true` dynamic imports
  still count toward "First Load JS" since the client needs that code
  immediately to hydrate the SSR'd output. Wrapping the dynamic import
  in a genuine Client Component (which a Server Component page can
  still render directly) was what actually deferred the load to after
  hydration. Measured with `next build`: Analytics 195 kB → 89.1 kB,
  Skills 198 kB → 100 kB, and the new public profile link page
  192 kB → 94.2 kB — each chart now flashes a brief skeleton before
  mounting client-side instead of shipping in the main bundle.
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
- **Candidate comparison view** — ✅ shipped: a new Compare tab in
  Recruiter Tools (`/dashboard/recruiter/compare`) shows 2-4 selected
  candidates side by side — overall score, location, top languages,
  availability, and a bar-per-category breakdown of the full skill
  fingerprint (Backend/Frontend/Database/DevOps/Cloud/Problem
  Solving/Communication/Leadership). Selection happens via a
  circle-select toggle added to both the Directory and Shortlist
  candidate cards, with a floating "N selected · Compare" bar that
  carries the choice into the URL (`?ids=a,b,c`) so the comparison is
  linkable/shareable. Required extending `directory_profiles` with a
  `skill_fingerprint` column, synced alongside the rest of the
  directory row from the candidate's own Profile page visit — the same
  cached-snapshot constraint as the rest of the Directory (we only
  ever see a candidate's own most-recent sync, not a live fetch).
  Verified via Playwright against the demo account's fixture data.
- **Real two-factor authentication** — the Account Security card
  currently shows "Two-Factor Authentication: Enabled" as static
  copy; wire up an actual TOTP/authenticator flow.
- **Export profile as PDF** — generate a client-shareable PDF summary
  of a candidate's verified profile and skill fingerprint (pairs well
  with the shareable-link idea above).
- **Role/job matching module** — connect candidate profiles to open
  client roles from the core ATS/CRM (once built) and surface match
  scores based on the skill fingerprint.
- **Free vs. Premium tiers** — 🟡 partially shipped: the mechanism now
  exists as a `plan` column (`free` | `premium_dev` |
  `premium_recruiter`, `lib/premium.ts`'s `getPlan()`) plus a self-serve
  `/api/premium/upgrade` stub, and Recruiter Tools
  (Directory/Shortlists/Compare) is the first feature actually gated
  behind it (`premium_recruiter` specifically) — see "Recruiter Tools
  is now a separate premium section" above. The `premium_dev` tier
  exists in the schema and the test-plan toggle but isn't wired to any
  gated feature yet. Still needed: real subscription billing (Stripe
  is already available as a connector but not yet authorized in this
  environment) to replace the upgrade stub, a concrete feature split
  for what `premium_dev` actually unlocks (skill tests, PDF export,
  Growth Olympics eligibility, etc. — still aren't gated by anything),
  and a real checkout/plan-selection flow to replace the current
  one-directional "Upgrade Now" button.
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
