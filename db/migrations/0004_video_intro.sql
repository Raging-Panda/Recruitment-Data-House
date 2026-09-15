-- 0004_video_intro
--
-- Async video intro — a pasted link (Loom/YouTube/etc.), not a real file
-- upload (no storage bucket configured in this environment). Idempotent.

alter table candidate_profile
  add column if not exists video_intro_url text;
