# Manual To-Do

Operational tasks that need a human in the loop — can't be done from an
agent session (dashboard-only steps, secrets, etc.). Distinct from
`improvements.md`, which is the feature backlog.

- [x] **Connect Vercel via "Import Git Repository"** — done. Confirmed
  2026-10-21 from the Vercel bot's comment on PR #4: the repo is
  connected to the `recruitment-data-house-web` project (team
  `black-lone`, Root Directory `apps/web`), which builds a preview for
  every push and deploys `main` to production.
- [x] **Put production on its own domain** — done 2026-11-06. Production
  is `https://ipskill.blacklinetech.co.za`. GoDaddy registers the domain
  and runs its DNS (`ns15`/`ns16.domaincontrol.com`); the only record
  added was `CNAME ipskill → ca0f59dff8fc5674.vercel-dns-017.com`. The
  apex and `www` records point at the Wix site — leave them and the
  nameservers alone. `https://recruitment-data-house-web.vercel.app`
  still serves the app, but GitHub sign-in only works on the custom
  domain now.
- [x] **Production env vars on `recruitment-data-house-web`** — checked
  2026-11-06 (Project → Settings → Environment Variables; changes only
  apply to new deployments, so redeploy after editing):
  - `NEXTAUTH_URL` and `SITE_URL` = `https://ipskill.blacklinetech.co.za`.
    Without `NEXTAUTH_URL` NextAuth falls back to the per-deployment URL,
    which no OAuth app can have registered (this is what broke GitHub
    sign-in on 2026-10-15)
  - `NEXTAUTH_SECRET`
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — sign-in uses the
    `ipskill` **GitHub App** (client id `Iv23…`, not a separate OAuth
    App), whose only callback is
    `https://ipskill.blacklinetech.co.za/api/auth/callback/github`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Production only) — from
    the `IPSkillWebApp` OAuth client
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_GITHUB_IDS` — your own account ID, comma-separated for more
    than one. Admins get Admin → Plans, which is now the only way to give
    someone a paid plan
  - `NEXT_PUBLIC_CONTACT_EMAIL` — where "Request access" emails go. It's
    baked in at build time, so redeploy after changing it
  - `ALLOW_TEST_LOGIN` and `ENABLE_EMAIL_LOGIN` are unset — keep it that
    way (`ALLOW_TEST_LOGIN` must never be `true` on a real deployment;
    email login waits for password reset and email verification)
- [x] **Register the Google callback** — done 2026-11-06 on the
  `IPSkillWebApp` OAuth client (Google Cloud project IPSkill): authorized
  origin `https://ipskill.blacklinetech.co.za` and redirect URI
  `https://ipskill.blacklinetech.co.za/api/auth/callback/google`, with
  the localhost ones kept.
- [ ] **Run `db/migrations/0016_privacy_consents.sql` on Supabase** before
  the POPIA consent change deploys (Supabase → SQL Editor). Without the
  table, consents can't be saved: the dashboard lets everyone in anyway
  (it fails open rather than locking people out) and logs
  `[consent] check failed`.
- [ ] **Set the env vars that are still missing** (Production):
  - `GITHUB_MOBILE_CLIENT_ID`, `GITHUB_MOBILE_CLIENT_SECRET` — the mobile
    app's GitHub token exchange (`/api/mobile/github-token`) needs them
  - `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` — the login page only
    shows LinkedIn when both are set. Also add
    `https://ipskill.blacklinetech.co.za/api/auth/callback/linkedin` to
    the LinkedIn app's Authorized redirect URLs
- [ ] **Check the `ipskill` GitHub App's settings** — GitHub → Settings
  → Developer settings → GitHub Apps → ipskill.
  - Optional features: if "User-to-server token expiration" is on, a
    signed-in user's GitHub data stops loading after 8 hours (the app
    doesn't refresh tokens); turn it off, or the app needs refresh-token
    handling.
  - "Allow wildcard matching" is ticked on the redirect URI. The one
    exact callback doesn't need it, so it can be unticked.
- [ ] **Delete the leftover Vercel projects** — the old snapshot-upload
  projects (`ipskill`, `ipskill-diag`, `ipskill-web`), and check whether
  `recruitment-data-house` (which served the per-deployment link tested on
  2026-10-15) is a duplicate of `recruitment-data-house-web`.
- [ ] **Turn on 2FA for the Vercel account** — Vercel asks on every visit,
  and this account controls the live site.
- [ ] **Grant paid plans by hand** — there's no billing yet, so Premium
  Recruiter / Premium Dev are invite-only. When a "Request access" email
  arrives, open Admin → Plans, paste the account ID from the email and
  pick the plan (Free revokes it).
- [ ] **Publish the Google OAuth consent screen** — Branding was filled in
  on 2026-11-06 (home page, `/privacy`, `/terms`, authorized domain
  `blacklinetech.co.za`). What's left: Google Cloud → IPSkill project →
  Google Auth Platform → Audience → Publish app. Until it's published,
  only listed test users can sign in with Google.
- [ ] **Accept the data processing agreements** for Supabase and Vercel
  (both offer one in their dashboards/legal pages). The privacy policy
  says data sent to them outside South Africa is covered by agreements
  like these, as POPIA section 72 requires.
- [ ] **Have a lawyer read `/privacy`, `/terms` and the consent tick box**
  (`apps/web/src/components/consent-checkbox.tsx`) — they were drafted to
  match what the app actually does, not reviewed by a lawyer.
- [ ] **Register yourself as Information Officer** with the Information
  Regulator (inforegulator.org.za → eServices). The privacy policy names
  the owner of Blackline Technology as Information Officer; POPIA
  requires that person to be registered before the app processes
  personal information.
