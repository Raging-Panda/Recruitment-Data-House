-- Push notifications (mobile) — a device's Expo push token, registered
-- from the mobile app once notification permission is granted. Unique on
-- the token itself (not owner_id) since the same physical device/token can
-- only ever point at one Expo push destination at a time; if it moves to a
-- different IPSkill account (sign out, sign in as someone else) the
-- upsert just repoints owner_id rather than leaving two rows racing to
-- notify different people about the same device.
create table if not exists push_tokens (
  id           uuid primary key default gen_random_uuid(),
  owner_id     text        not null,
  expo_token   text        not null unique,
  platform     text,
  created_at   timestamptz not null default now()
);
create index if not exists push_tokens_owner_idx on push_tokens (owner_id);

alter table push_tokens enable row level security;
