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
