-- Attempt log behind lib/rate-limit.ts (login, 2FA, signup throttling).
-- Serverless instances don't share memory, so a counter held in process
-- would reset on every cold start and could be dodged by spreading
-- requests across instances; this table is the shared source of truth.
--
-- `key` is a namespaced bucket such as login:email:<hash>, login:ip:<ip>,
-- totp:user:<id>. Emails are hashed before they get here so this table
-- never holds raw addresses. Rows are append-only and short-lived: the
-- limiter prunes anything older than a day opportunistically.
create table if not exists rate_limit_events (
  key        text        not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_events_key_time_idx
  on rate_limit_events (key, created_at desc);

alter table rate_limit_events enable row level security;
