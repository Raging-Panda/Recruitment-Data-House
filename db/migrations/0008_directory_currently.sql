-- Small connecting gap: the "Currently" one-liner (candidate_profile.currently,
-- shipped as part of the authored About/narrative layer) never made it into
-- the directory snapshot, so it wasn't visible anywhere outside the
-- candidate's own dashboard Profile page. Mirrors it onto directory_profiles
-- so it can surface on the public vanity profile, the token share link, the
-- recruiter Directory detail page, and Directory cards. Idempotent.

alter table directory_profiles
  add column if not exists currently text,
  add column if not exists currently_updated_at timestamptz;
