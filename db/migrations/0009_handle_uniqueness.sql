-- Real bug found via live edge-case testing: `isHandleTaken()` only
-- checked candidate_profile.handle, never directory_profiles.handle — the
-- table /u/[handle] actually reads from, and the one seed/showcase
-- profiles were inserted into directly (with no candidate_profile row at
-- all). A real account could successfully "claim" a handle a showcase
-- profile already publicly owned; once that account's own profile synced,
-- two directory_profiles rows shared one handle and /u/<handle> started
-- resolving unpredictably — sometimes the wrong owner, sometimes a
-- spurious "not found" (Supabase's .maybeSingle() errors on >1 matching
-- row, which the page's error handling quietly turns into a 404).
--
-- lib/handle.ts now checks both tables before allowing a claim, but that
-- app-level check can't fully close a race between two concurrent claims
-- — this partial unique index is the real backstop: the database itself
-- refuses a second row with a handle already in use by another github_id,
-- regardless of which code path tried to write it. Partial (`where handle
-- is not null`) so any number of rows with no handle set can coexist.
--
-- Before running this, deduplicate any existing collision first — this
-- statement fails if one already exists:
--   select handle, array_agg(github_id) from directory_profiles
--   where handle is not null group by handle having count(*) > 1;

create unique index if not exists directory_profiles_handle_unique
  on directory_profiles (handle)
  where handle is not null;
