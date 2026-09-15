-- Proof-of-work links on skill claims — a developer attaches a concrete,
-- clickable artifact (a merged PR, a release, a package, a talk) to one of
-- the 8 fingerprint skill categories, backing the claim with something a
-- recruiter or peer can actually click through and verify. Same posture as
-- external_links / featured_projects: RLS on, no policies, service-role
-- only.

create table if not exists skill_proofs (
  id             uuid primary key default gen_random_uuid(),
  owner_id       text        not null,
  skill_category text        not null check (skill_category in (
                   'Backend', 'Frontend', 'Database', 'DevOps', 'Cloud',
                   'Problem Solving', 'Communication', 'Leadership'
                 )),
  title          text        not null,
  url            text        not null,
  created_at     timestamptz not null default now()
);
create index if not exists skill_proofs_owner_idx on skill_proofs (owner_id, skill_category);

alter table skill_proofs enable row level security;
