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
  score, availability) any signed-in dev can browse, with a read-only
  detail view per developer — the recruiter-facing counterpart to the
  candidate-facing profile screens. Entries are a cached snapshot
  (`directory_profiles`, refreshed whenever a candidate visits their
  own Profile page), not a live GitHub fetch, since we only ever hold
  the signed-in user's own access token. Still open: no verification-
  status filter yet (waiting on the candidate-verification layer from
  `PLAN.md`), and no recruiter-only gating — right now any dev can
  browse the directory, not just recruiters.
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
