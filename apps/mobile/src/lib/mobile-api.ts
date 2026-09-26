import { config } from "./config";

/**
 * The mobile app has no NextAuth session/cookie — every `/api/mobile/*`
 * route resolves identity from this raw GitHub access token instead (see
 * lib/mobile-auth.ts on the backend), sent as a normal bearer token
 * rather than a body field so GET requests don't need an awkward body.
 */
async function mobileFetch(accessToken: string, path: string, init?: RequestInit) {
  const res = await fetch(`${config.authBackendUrl}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}

export interface ConversationSummary {
  id: string;
  otherId: string;
  otherName: string;
  otherAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: boolean;
  status: "pending" | "accepted";
  isIncomingRequest: boolean;
}

export interface MessageItem {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ThreadResponse {
  messages: MessageItem[];
  viewerId: string;
  status: "pending" | "accepted";
  isPendingOnMe: boolean;
  otherName: string;
  otherAvatarUrl: string | null;
}

export function listConversations(accessToken: string): Promise<{ conversations: ConversationSummary[] }> {
  return mobileFetch(accessToken, "/api/mobile/messages/conversations");
}

export function getThread(accessToken: string, conversationId: string): Promise<ThreadResponse> {
  return mobileFetch(accessToken, `/api/mobile/messages/${conversationId}`);
}

export function sendMessage(accessToken: string, conversationId: string, body: string) {
  return mobileFetch(accessToken, `/api/mobile/messages/${conversationId}`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function respondToRequest(accessToken: string, conversationId: string, action: "accept" | "decline") {
  return mobileFetch(accessToken, `/api/mobile/messages/${conversationId}/respond`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export interface InterviewRequest {
  id: string;
  recruiterId: string;
  candidateId: string;
  title: string;
  durationMinutes: number;
  proposedSlots: string[];
  selectedSlot: string | null;
  status: "pending" | "booked" | "cancelled";
  createdAt: string;
  otherName: string;
}

export function listInterviews(accessToken: string): Promise<{ interviews: InterviewRequest[] }> {
  return mobileFetch(accessToken, "/api/mobile/interviews");
}

export function bookInterview(accessToken: string, id: string, slot: string) {
  return mobileFetch(accessToken, `/api/mobile/interviews/${id}/book`, {
    method: "POST",
    body: JSON.stringify({ slot }),
  });
}

export function cancelInterview(accessToken: string, id: string) {
  return mobileFetch(accessToken, `/api/mobile/interviews/${id}/cancel`, { method: "POST" });
}
