# Manual To-Do

Operational tasks that need a human in the loop — can't be done from an
agent session (dashboard-only steps, secrets, etc.). Distinct from
`improvements.md`, which is the feature backlog.

- [x] **Connect Vercel via "Import Git Repository"** — done. Confirmed
  2026-10-21 from the Vercel bot's comment on PR #4: the repo is
  connected to the `recruitment-data-house-web` project (team
  `black-lone`, Root Directory `apps/web`), which builds a preview for
  every push; production is `https://recruitment-data-house-web.vercel.app`.
  The follow-up steps the original item listed are split out below,
  since they're not all done.
- [ ] **Finish the production env vars on `recruitment-data-house-web`**
  (Project → Settings → Environment Variables; Production, plus Preview
  if previews should sign in too — then redeploy, since changes only
  apply to new deployments):
  - `NEXTAUTH_URL=https://recruitment-data-house-web.vercel.app` —
    without it NextAuth falls back to the per-deployment URL, which no
    OAuth app can have registered (this is what broke GitHub sign-in on
    2026-10-15)
  - `NEXTAUTH_SECRET`
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — set. Sign-in uses the
    `ipskill` **GitHub App** (client id `Iv23…`, not a separate OAuth
    App), whose callback is already
    `https://recruitment-data-house-web.vercel.app/api/auth/callback/github`
  - `GITHUB_MOBILE_CLIENT_ID`, `GITHUB_MOBILE_CLIENT_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `LINKEDIN_CLIENT_ID`,
    `LINKEDIN_CLIENT_SECRET` — missing on the deployment tested
    2026-10-15 (the login page only shows those buttons when both halves
    are set)
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard →
    Project Settings → API → service_role — must be pasted in by hand)
  - Leave `ALLOW_TEST_LOGIN` unset (never `true` on a real deployment)
- [ ] **Register the production callback URLs** on the existing apps
  (both allow several, so keep the localhost ones):
  - Google OAuth client → Authorized redirect URIs:
    `https://recruitment-data-house-web.vercel.app/api/auth/callback/google`
  - LinkedIn app → Authorized redirect URLs:
    `https://recruitment-data-house-web.vercel.app/api/auth/callback/linkedin`
- [ ] **Check the `ipskill` GitHub App's token expiry** — GitHub → Settings
  → Developer settings → GitHub Apps → ipskill → Optional features. If
  "User-to-server token expiration" is on, a signed-in user's GitHub data
  stops loading after 8 hours (the app doesn't refresh tokens); turn it
  off, or the app needs refresh-token handling.
- [ ] **Delete the leftover Vercel projects** — the old snapshot-upload
  projects (`ipskill`, `ipskill-diag`, `ipskill-web`), and check whether
  `recruitment-data-house` (which served the per-deployment link tested on
  2026-10-15) is a duplicate of `recruitment-data-house-web`.
