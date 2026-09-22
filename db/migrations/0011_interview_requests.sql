-- Interview scheduling / calendar sync — deliberately the "booking link"
-- version, not live free/busy calendar sync: a recruiter proposes one or
-- more time slots, the candidate picks one, and both sides get a
-- one-click "add to calendar" link (Google/Outlook/.ics) generated
-- client-side with no OAuth or external API needed. Real free/busy sync
-- would need its own Calendar-scoped OAuth app per provider — parked
-- until that's wanted, same as the rest of this backlog's
-- needs-a-real-credential items.
create table if not exists interview_requests (
  id               uuid primary key default gen_random_uuid(),
  recruiter_id     text        not null,
  candidate_id     text        not null,
  title            text        not null default 'Interview',
  duration_minutes integer     not null default 30,
  -- Array of ISO 8601 datetime strings the recruiter proposed.
  proposed_slots   jsonb       not null,
  selected_slot    timestamptz,
  status           text        not null default 'pending'
                     check (status in ('pending', 'booked', 'cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists interview_requests_candidate_idx on interview_requests (candidate_id);
create index if not exists interview_requests_recruiter_idx on interview_requests (recruiter_id);

alter table interview_requests enable row level security;
