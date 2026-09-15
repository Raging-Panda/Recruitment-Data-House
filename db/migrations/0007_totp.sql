-- Real two-factor authentication (TOTP) for regular email/password
-- accounts. GitHub/Google/LinkedIn sign-ins delegate MFA to the OAuth
-- provider itself, so only `users` (the email/password table) needs this.
-- Idempotent.

alter table users
  add column if not exists totp_secret text,
  add column if not exists totp_enabled boolean not null default false,
  add column if not exists totp_backup_codes text[];
