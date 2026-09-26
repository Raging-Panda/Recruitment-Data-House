import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
export { MAX_PROPOSED_SLOTS } from "@/lib/interview-constants";

export type InterviewStatus = "pending" | "booked" | "cancelled";

export interface InterviewRequest {
  id: string;
  recruiterId: string;
  candidateId: string;
  title: string;
  durationMinutes: number;
  proposedSlots: string[];
  selectedSlot: string | null;
  status: InterviewStatus;
  createdAt: string;
}

interface InterviewRow {
  id: string;
  recruiter_id: string;
  candidate_id: string;
  title: string;
  duration_minutes: number;
  proposed_slots: string[];
  selected_slot: string | null;
  status: InterviewStatus;
  created_at: string;
}

const SELECT =
  "id, recruiter_id, candidate_id, title, duration_minutes, proposed_slots, selected_slot, status, created_at";

function rowToInterview(row: InterviewRow): InterviewRequest {
  return {
    id: row.id,
    recruiterId: row.recruiter_id,
    candidateId: row.candidate_id,
    title: row.title,
    durationMinutes: row.duration_minutes,
    proposedSlots: row.proposed_slots,
    selectedSlot: row.selected_slot,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function createInterviewRequest(
  recruiterId: string,
  candidateId: string,
  title: string,
  durationMinutes: number,
  proposedSlots: string[]
): Promise<InterviewRequest> {
  const { data, error } = await getSupabaseAdmin()
    .from("interview_requests")
    .insert({
      recruiter_id: recruiterId,
      candidate_id: candidateId,
      title,
      duration_minutes: durationMinutes,
      proposed_slots: proposedSlots,
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return rowToInterview(data as InterviewRow);
}

/** Everything involving the given identity, either side — sent as a
 * recruiter or received as a candidate — newest first. */
export async function listInterviewsFor(githubId: string): Promise<InterviewRequest[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("interview_requests")
    .select(SELECT)
    .or(`recruiter_id.eq.${githubId},candidate_id.eq.${githubId}`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as InterviewRow[]).map(rowToInterview);
}

export async function getInterviewRequest(id: string): Promise<InterviewRequest | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("interview_requests")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToInterview(data as InterviewRow) : null;
}

/** Only the candidate the request is addressed to can book it, and only
 * while it's still pending — scoping both in the query means a stale
 * double-click or a request for someone else's interview matches zero
 * rows rather than silently double-booking. */
export async function bookInterviewSlot(
  id: string,
  candidateId: string,
  slot: string
): Promise<InterviewRequest | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("interview_requests")
    .update({ selected_slot: slot, status: "booked", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("candidate_id", candidateId)
    .eq("status", "pending")
    .select(SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToInterview(data as InterviewRow) : null;
}

/** Either side can cancel — a recruiter rethinking a request they sent,
 * or a candidate declining one they received. */
export async function cancelInterviewRequest(
  id: string,
  viewerId: string
): Promise<InterviewRequest | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("interview_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .or(`recruiter_id.eq.${viewerId},candidate_id.eq.${viewerId}`)
    .select(SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToInterview(data as InterviewRow) : null;
}

export type BookInterviewResult =
  | { ok: true; interview: InterviewRequest }
  | { ok: false; reason: "not_found" | "invalid_slot" | "no_longer_open" };

/**
 * The full booking flow — used by both the web and mobile routes so
 * neither has to duplicate the "is this really addressed to me, is this
 * really one of the offered times" checks or the recruiter notification.
 */
export async function bookInterviewAndNotify(
  id: string,
  candidateId: string,
  slot: string
): Promise<BookInterviewResult> {
  const existing = await getInterviewRequest(id).catch(() => null);
  if (!existing || existing.candidateId !== candidateId) {
    return { ok: false, reason: "not_found" };
  }
  if (!existing.proposedSlots.includes(slot)) {
    return { ok: false, reason: "invalid_slot" };
  }

  const booked = await bookInterviewSlot(id, candidateId, slot).catch(() => null);
  if (!booked) return { ok: false, reason: "no_longer_open" };

  void createNotification(booked.recruiterId, {
    type: "interview_booked",
    title: "Interview booked",
    body: `Your interview request "${booked.title}" was booked.`,
    link: "/dashboard/interviews",
  });

  return { ok: true, interview: booked };
}

/** Same pairing for cancel — resolves the other party and notifies them,
 * so a caller never has to work that out itself. */
export async function cancelInterviewAndNotify(
  id: string,
  viewerId: string
): Promise<InterviewRequest | null> {
  const existing = await getInterviewRequest(id).catch(() => null);
  if (!existing || (existing.recruiterId !== viewerId && existing.candidateId !== viewerId)) {
    return null;
  }

  const cancelled = await cancelInterviewRequest(id, viewerId).catch(() => null);
  if (!cancelled) return null;

  const otherParty = cancelled.recruiterId === viewerId ? cancelled.candidateId : cancelled.recruiterId;
  void createNotification(otherParty, {
    type: "interview_cancelled",
    title: "Interview cancelled",
    body: `"${cancelled.title}" was cancelled.`,
    link: "/dashboard/interviews",
  });

  return cancelled;
}
