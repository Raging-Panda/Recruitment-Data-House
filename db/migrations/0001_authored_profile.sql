-- 0001_authored_profile
--
-- Adds the developer-authored narrative layer to the Profile page:
--   * candidate_profile.about_authored / .currently  — free-text the
--     developer writes themselves, layered on top of the GitHub bio
--   * featured_projects                              — a curated, ordered
--     pin list of repos, each with a written blurb
--
-- Run this in the Supabase SQL editor for project ovapgfrxfhzslsszeoxq.
-- Safe to re-run (idempotent).

alter table candidate_profile
  add column if not exists about_authored        text,
  add column if not exists currently             text,
  add column if not exists currently_updated_at  timestamptz;

create table if not exists featured_projects (
  id          uuid primary key default gen_random_uuid(),
  github_id   text        not null,
  repo_name   text        not null,
  repo_url    text,
  blurb       text        not null,
  languages   text[]      not null default '{}',
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (github_id, repo_name)
);

create index if not exists featured_projects_github_id_idx
  on featured_projects (github_id, sort_order);

-- Same posture as work_experience / certifications: RLS on, no policies,
-- so the service-role key is the only way in and every query is scoped by
-- the authenticated session's github_id in application code.
alter table featured_projects enable row level security;
