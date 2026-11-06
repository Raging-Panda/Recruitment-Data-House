-- POPIA consent records behind lib/consent.ts. One row per account per
-- version of the privacy policy it consented to (CONSENT_VERSION in
-- lib/legal.ts), so there's proof of who agreed to what and when.
--
-- `owner_id` is the same app-identity value used as `github_id` elsewhere
-- (a numeric GitHub id, "google:<sub>", "linkedin:<sub>" or
-- "local:<users.id>"). Deleted with the account (lib/account-deletion.ts).
create table if not exists privacy_consents (
  owner_id     text        not null,
  version      text        not null,
  consented_at timestamptz not null default now(),
  primary key (owner_id, version)
);

alter table privacy_consents enable row level security;
