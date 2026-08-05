# Improvements Backlog

Ideas for the IPSkill Developer Hub beyond the current scaffold. Not
scheduled or scoped yet — just a running list to pull from.

## Requested

- **Skill tests** — short, timed coding/knowledge assessments per
  language or stack, scored and folded into the skill fingerprint
  alongside the passive GitHub-derived signals.
- **Recent project history with GitHub** — a timeline view of recent
  commits/PRs/releases per repo, not just the current snapshot, so
  recruiters can see trajectory (ramping up, going quiet, switching
  stacks) rather than a single point-in-time score.
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

## Visual & UI polish

- **Loading states** — real skeleton screens (profile card, radar
  chart, project list shapes) while GitHub data loads, instead of a
  blank page (web) or a bare spinner (mobile). Includes a branded
  splash/loading screen on mobile app cold start.
- **Real icon set** — swap the emoji placeholders (🔔 🏠 🔍 💬 👤 📊 in
  the sidebar/tab bar/topbar) for a proper icon library that matches
  the fingerprint line-art of the IPSkill logo, with consistent
  sizing and active/inactive states.
- **Empty states with illustration + copy** — "No projects yet",
  "No language data yet" etc. are currently plain text; give them a
  small illustration and a clear next action (e.g. "Push a commit to
  see this fill in").
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
- **Growth Olympics** — a monthly competition among premium users:
  whoever shows the biggest skill-fingerprint/activity growth over
  the month wins a prize (e.g. a R1000 Takealot voucher). Needs
  month-over-month snapshotting of each user's fingerprint/activity
  so "growth" is measurable, a leaderboard, a defined growth metric
  (which is fairest — overall score delta? weighted by category?),
  anti-gaming safeguards (e.g. against padding commit counts), and a
  way to actually fulfil the prize each month.
