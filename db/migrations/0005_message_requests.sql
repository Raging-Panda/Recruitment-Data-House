-- 0005_message_requests
--
-- Lets a candidate choose, in Settings, whether anyone can message them
-- directly ("open") or must send a request they accept/decline first
-- ("request"). Idempotent.

alter table candidate_profile
  add column if not exists message_preference text not null default 'open'
    check (message_preference in ('open', 'request'));

alter table conversations
  add column if not exists status text not null default 'accepted'
    check (status in ('pending', 'accepted')),
  -- Who owes the accept/decline — the recipient at the moment the
  -- conversation was created (whoever's message_preference was 'request').
  -- Kept as an explicit column rather than inferred from the first
  -- message's sender, so listing/gating never needs a join.
  add column if not exists pending_acceptance_by text;
