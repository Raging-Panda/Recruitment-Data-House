-- 0003_public_identity_and_growth
--
-- Schema for the "north star" / monetization / infra batch: vanity
-- handles + public visibility, follow graph, kudos, external links
-- (writing/talks/packages), score snapshots (Growth Olympics + trending),
-- referrals, a minimal job-roles table, public API keys, and in-app
-- messaging. One migration covering the whole batch rather than one per
-- feature. Idempotent — safe to re-run.

-- Vanity handle + public/private visibility. A public profile can be
-- reached at /@<handle> without auth; visibility also controls whether it
-- appears in the public developer index (see the Directory work).
alter table candidate_profile
  add column if not exists handle       text unique,
  add column if not exists visibility   text not null default 'private' check (visibility in ('private', 'public')),
  add column if not exists company      text;

alter table directory_profiles
  add column if not exists handle       text,
  add column if not exists visibility   text not null default 'private' check (visibility in ('private', 'public')),
  add column if not exists company      text;

create index if not exists directory_profiles_handle_idx on directory_profiles (handle) where handle is not null;
create index if not exists directory_profiles_visibility_idx on directory_profiles (visibility) where visibility = 'public';

-- Periodic score snapshots — Growth Olympics (month-over-month delta) and
-- "trending developers" both need a point-in-time history, not just the
-- current score.
create table if not exists score_snapshots (
  id           uuid primary key default gen_random_uuid(),
  owner_id     text        not null,
  overall_score integer    not null,
  captured_at  timestamptz not null default now()
);
create index if not exists score_snapshots_owner_idx on score_snapshots (owner_id, captured_at desc);

-- Follow graph.
create table if not exists follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  text        not null,
  followee_id  text        not null,
  created_at   timestamptz not null default now(),
  unique (follower_id, followee_id)
);
create index if not exists follows_follower_idx on follows (follower_id);
create index if not exists follows_followee_idx on follows (followee_id);

-- Public-ish activity feed source — populated on genuine milestones
-- (verified skill passed, certification added, featured project added,
-- endorsement received) for people the viewer follows.
create table if not exists activity_events (
  id           uuid primary key default gen_random_uuid(),
  owner_id     text        not null,
  type         text        not null,
  title        text        not null,
  body         text,
  occurred_at  timestamptz not null default now()
);
create index if not exists activity_events_owner_idx on activity_events (owner_id, occurred_at desc);

-- Lightweight reactions on another developer's milestone.
create table if not exists kudos (
  id           uuid primary key default gen_random_uuid(),
  from_id      text        not null,
  event_id     uuid        not null references activity_events(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (from_id, event_id)
);

-- "Beyond GitHub" — writing, talks, published packages, notable OSS
-- contributions to repos the developer doesn't own.
create table if not exists external_links (
  id           uuid primary key default gen_random_uuid(),
  owner_id     text        not null,
  kind         text        not null check (kind in ('writing', 'talk', 'package', 'oss')),
  title        text        not null,
  url          text        not null,
  description  text,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists external_links_owner_idx on external_links (owner_id, sort_order);

-- Referral program.
create table if not exists referral_codes (
  owner_id     text        primary key,
  code         text        not null unique,
  created_at   timestamptz not null default now()
);
create table if not exists referrals (
  id                uuid primary key default gen_random_uuid(),
  code              text        not null references referral_codes(code),
  referred_owner_id text       not null unique,
  created_at        timestamptz not null default now(),
  rewarded          boolean     not null default false
);

-- Minimal role/job-matching stub — enough to demo a match score against
-- the existing skill fingerprint, not a real ATS.
create table if not exists job_roles (
  id               uuid primary key default gen_random_uuid(),
  title            text        not null,
  company          text        not null,
  location         text,
  description      text,
  required_skills  jsonb       not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

-- Scoped API keys for the public enterprise API.
create table if not exists api_keys (
  id           uuid primary key default gen_random_uuid(),
  key_hash     text        not null unique,
  label        text        not null,
  owner_email  text        not null,
  created_at   timestamptz not null default now(),
  revoked      boolean     not null default false
);

-- In-app messaging.
create table if not exists conversations (
  id             uuid primary key default gen_random_uuid(),
  participant_a  text        not null,
  participant_b  text        not null,
  created_at     timestamptz not null default now(),
  unique (participant_a, participant_b)
);
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid        not null references conversations(id) on delete cascade,
  sender_id       text        not null,
  body            text        not null,
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);
create index if not exists messages_conversation_idx on messages (conversation_id, created_at);

-- RLS on, no policies — service-role only, same posture as every other
-- table in this app.
alter table score_snapshots enable row level security;
alter table follows enable row level security;
alter table activity_events enable row level security;
alter table kudos enable row level security;
alter table external_links enable row level security;
alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table job_roles enable row level security;
alter table api_keys enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
