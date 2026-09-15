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
  - Install Command: leave default — root `package.json` now has
    `packageManager: pnpm@9.15.9` pinned (2026-09-15), so corepack
    resolves the exact right pnpm version without an override
  - Env vars — everything below is real and already in a working
    `apps/web/.env.local` locally as of 2026-09-15, but none of it is
    in Vercel yet:
    - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (a *second*, separate
      GitHub OAuth App for this domain — the local one's callback URL
      is `http://localhost:3000/...` and can't also serve the prod
      domain; same App-creation flow as the original, see `.env.example`)
    - `GITHUB_MOBILE_CLIENT_ID`, `GITHUB_MOBILE_CLIENT_SECRET`
    - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — same story: the
      existing Google Cloud OAuth client's redirect URI is
      localhost-only, so this prod domain needs its own redirect URI
      added there (Google allows multiple redirect URIs per client,
      so this can reuse the same client id/secret rather than a new one
      — just add `https://<domain>/api/auth/callback/google` under
      "Authorized redirect URIs")
    - `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` — same as Google,
      add `https://<domain>/api/auth/callback/linkedin` to the existing
      LinkedIn app's Authorized redirect URLs rather than making a new app
    - `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (the real deployed domain)
    - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (from the Supabase
      dashboard → Project Settings → API → service_role — never shareable
      via tooling, must be pasted in by hand)
    - Leave `ALLOW_TEST_LOGIN` unset (never `true` on a real deployment)
  - After it's live, add the prod callback URL to the GitHub OAuth App,
    the Google OAuth client, and the LinkedIn app (each above) — all
    three need it before their login button works on the real domain.
  Once this is connected, the old snapshot-upload projects (`ipskill`,
  `ipskill-diag`, `ipskill-web`) can be deleted from the Vercel dashboard.
