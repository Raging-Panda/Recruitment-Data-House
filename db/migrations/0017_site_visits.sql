-- Anonymous page-visit log behind lib/site-visits.ts and /api/visits —
-- the website traffic numbers (visitors, sessions, sources, top pages).
-- Cookieless: nothing is stored in the visitor's browser.
--
-- No IP address or user agent is kept. `visitor_hash` is an HMAC of the
-- day, IP and user agent, so it changes every day and can't be traced
-- back to a person or linked across days. `path` has ids, tokens and
-- profile handles replaced with placeholders (/u/[handle], /p/[token]),
-- and `referrer_host` is only the referring site's host name, never its
-- full URL. Rows older than about 13 months are pruned opportunistically
-- by the recording route.
create table if not exists site_visits (
  id            bigint      generated always as identity primary key,
  visited_at    timestamptz not null default now(),
  path          text        not null,
  referrer_host text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  visitor_hash  text        not null,
  device        text        not null check (device in ('desktop', 'mobile', 'tablet')),
  country       text,
  signed_in     boolean     not null default false
);
create index if not exists site_visits_visited_at_idx on site_visits (visited_at desc);

alter table site_visits enable row level security;
