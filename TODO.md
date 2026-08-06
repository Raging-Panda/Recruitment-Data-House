# Manual To-Do

Operational tasks that need a human in the loop — can't be done from an
agent session (dashboard-only steps, secrets, etc.). Distinct from
`improvements.md`, which is the feature backlog.

- [ ] **Connect Vercel via "Import Git Repository"** — the current
  `ipskill-web` Vercel project was created by an agent session through a
  one-off snapshot file upload (no git integration, no auto-deploy on
  push). Go to the Vercel dashboard → Add New → Project → Import Git
  Repository → select `Raging-Panda/Recruitment-Data-House`, and set:
  - Root Directory: `apps/web`
  - Framework Preset: Next.js (should auto-detect)
  - Install Command: leave default (works once `packageManager` is set
    in the root `package.json`) or override with
    `corepack enable && pnpm install --no-frozen-lockfile` if it doesn't
  - Env vars: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
    `GITHUB_MOBILE_CLIENT_ID`, `GITHUB_MOBILE_CLIENT_SECRET`,
    `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (the real deployed domain),
    `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (from the Supabase
    dashboard → Project Settings → API → service_role — never shareable
    via tooling, must be pasted in by hand)
  - After it's live, update the web GitHub OAuth App's callback URL to
    match the real domain.
  Once this is connected, the old snapshot-upload projects (`ipskill`,
  `ipskill-diag`, `ipskill-web`) can be deleted from the Vercel dashboard.
