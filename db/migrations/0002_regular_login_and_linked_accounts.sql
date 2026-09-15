-- 0002_regular_login_and_linked_accounts
--
-- Real email/password accounts, plus the schema for OAuth account linking
-- (GitHub, Google, and — coming next — LinkedIn) so that feature doesn't
-- need a second migration. Run this in the Supabase SQL editor for project
-- ovapgfrxfhzslsszeoxq. Safe to re-run (idempotent).

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text        not null unique,
  password_hash text        not null,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table users enable row level security;

-- Not wired up to any route yet (see lib/auth.ts / improvements.md) — the
-- schema for the next phase, account linking. `owner_id` matches the same
-- app-identity value already used as `github_id` everywhere else (a real
-- numeric GitHub id, "google:<sub>", or "local:<users.id>"), so linking
-- doesn't require touching the dozen-plus tables already keyed that way —
-- only the pages that currently read session.accessToken directly need to
-- start resolving a GitHub token through this table instead.
create table if not exists linked_accounts (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            text        not null,
  provider            text        not null check (provider in ('github', 'google', 'linkedin')),
  provider_account_id text        not null,
  provider_login      text,
  access_token        text,
  avatar_url          text,
  linked_at           timestamptz not null default now(),
  unique (owner_id, provider),
  unique (provider, provider_account_id)
);

create index if not exists linked_accounts_owner_id_idx on linked_accounts (owner_id);

alter table linked_accounts enable row level security;
