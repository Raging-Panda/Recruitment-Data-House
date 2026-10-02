-- Moderation/verification state for a profile, kept off directory_profiles
-- because that row is a rewritable snapshot (syncDirectoryProfile upserts
-- it on every dashboard load) — admin decisions must survive a re-sync.
--
-- admin_verified: shows the "Reviewed by IPSkill" badge.
-- hidden:         pulls the profile from /u/[handle], the public index and
--                 the sitemap (a moderation takedown, reversible).
-- Automatic badges (GitHub-connected, skill-verified) are computed at read
-- time from existing data and are deliberately not stored here.
create table if not exists profile_verifications (
  github_id      text primary key,
  admin_verified boolean     not null default false,
  hidden         boolean     not null default false,
  notes          text,
  updated_by     text,
  updated_at     timestamptz not null default now()
);

alter table profile_verifications enable row level security;
