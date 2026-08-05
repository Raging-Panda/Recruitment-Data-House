# IPSkill — Developer Hub

Monorepo for the Developer Hub (skill validation layer) described in
[`PLAN.md`](./PLAN.md): candidates connect their GitHub account and get a
profile dashboard showing language breakdown, activity, and repo quality
signals — one input alongside manual technical screening, not a replacement
for it.

## Structure

```
apps/web      Next.js dashboard (App Router, TypeScript, Tailwind, NextAuth)
apps/mobile   Expo/React Native app (TypeScript)
packages/shared  Branding tokens, shared types, GitHub API client
```

## Prerequisites

- Node 20+
- pnpm (`corepack enable` or `npm i -g pnpm`)
- Two GitHub OAuth Apps (web and mobile need separate ones — see below)

## GitHub OAuth setup

Create both apps at https://github.com/settings/developers:

1. **Web app** — Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
2. **Mobile app** — Authorization callback URL: `ipskill://`
   (GitHub OAuth Apps only support one fixed callback URL each, and the
   mobile app redirects to a custom `ipskill://` scheme instead of a
   `localhost` URL, so it can't share the web app's OAuth App.)

Copy the env files and fill in the values:

```
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

- `apps/web/.env.local`: `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` (web app),
  `GITHUB_MOBILE_CLIENT_ID`/`GITHUB_MOBILE_CLIENT_SECRET` (mobile app — the
  secret is only ever used server-side in `apps/web`'s token-exchange route),
  `NEXTAUTH_SECRET` (`openssl rand -base64 32`), `NEXTAUTH_URL`,
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (work history storage — see
  below).
- `apps/mobile/.env`: `EXPO_PUBLIC_GITHUB_CLIENT_ID` (the mobile app's client
  ID only — never the secret), `EXPO_PUBLIC_AUTH_BACKEND_URL` pointing at the
  running `apps/web` instance.

## Work history, certifications & skill tests (Supabase)

Unlike Skills/Projects, work history, certifications, and skill test results
aren't sourced from GitHub — they need real storage. The `ipskill` Supabase
project holds:

- `work_experience` (company, role, location, dates, description)
- `certifications` (name, issuer, issue/expiry dates, credential ID/URL,
  description)
- `skill_test_templates` / `skill_test_questions` / `skill_test_attempts` —
  lightweight, in-house multiple-choice tests (3 seeded: JavaScript, Python,
  SQL fundamentals). This is deliberately not a real code-execution sandbox;
  the plan (see `improvements.md`) is to migrate to a proctored third-party
  vendor (CodeSignal/HackerRank/Coderbyte) once there's revenue to justify
  it. Correct answers (`correct_index`) never leave the server — `/start`
  only ever returns question text and choices, and scoring happens in
  `/api/skill-tests/attempts/[id]/submit`.

All are keyed by the candidate's GitHub numeric ID (stable across username
changes, unlike the login string).

There's no Supabase Auth involved — auth is still GitHub OAuth via NextAuth.
Both tables have Row Level Security enabled with **no policies**, so the
only way to read or write them is the service-role key, and that key is
only ever used server-side (`apps/web/src/lib/supabase.ts`, guarded by the
`server-only` import). Every `/api/experience` and `/api/certifications`
route re-derives the candidate's identity from the authenticated NextAuth
session before querying — a request can never read or write another
candidate's rows by passing a different ID, since the ID isn't taken from
the request at all.

Grab `SUPABASE_SERVICE_ROLE_KEY` from the Supabase dashboard (Project
Settings → API → service_role) — it's a secret and isn't obtainable through
tooling, by design.

The mobile app can't hold an OAuth client secret, so it exchanges its GitHub
authorization code for an access token via `apps/web`'s
`/api/mobile/github-token` route rather than talking to GitHub's token
endpoint directly. This means `apps/web` needs to be running for mobile login
to work.

## Development

```
pnpm install
pnpm dev:web      # http://localhost:3000
pnpm dev:mobile   # Expo dev server
```

## What's real vs. placeholder

- **Real**: GitHub OAuth login (web + mobile), live GitHub data (repos,
  languages, PRs, issues, recent commit activity), skill fingerprint derived
  from that data.
- **Also real**: Work history (Experience page), Certifications, and Skill
  tests (Verified Skills panel on the Skills page) — all backed by
  Supabase, scoped per-candidate via the authenticated session.
- **Placeholder**: Profile Views / Search Appearances / Connection Requests
  on the Analytics screen are derived from account signals, not real
  platform event tracking (GitHub doesn't expose that data, and IPSkill
  doesn't have its own analytics pipeline yet). Achievements, Settings,
  Resume upload, and the Home/Search/Messages tabs are still unbuilt stubs.
- **Not started**: the candidate verification layer and core ATS/CRM from
  `PLAN.md` — this repo currently covers the Developer Hub only.
