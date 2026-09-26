import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootTabParamList } from "./types";

/**
 * Lets code outside the component tree (the push-notification tap
 * handler in use-push-notifications.ts) trigger navigation — that hook
 * fires from an OS-level event listener, not a screen, so it has no
 * navigation prop of its own to call.
 */
export const navigationRef = createNavigationContainerRef<RootTabParamList>();

/** Parses a notification's `link` (a relative web path, since the same
 * payload also has to make sense to a plain Linking.openURL fallback)
 * into a native navigation action for the paths this app has real
 * screens for. Returns false for anything else (Analytics extras,
 * Shortlists — recruiter-only, no mobile screen at all) so the caller
 * falls back to opening the web page instead. */
export function navigateForLink(link: string): boolean {
  if (!navigationRef.isReady()) return false;

  // React Navigation's own escape hatch for navigating into a nested
  // navigator's screen from outside it — RootTabParamList doesn't (and
  // shouldn't) know its child stacks' param lists itself, and the
  // overload resolution for a nested `{ screen, params }` target isn't
  // expressible from an untyped ref no matter how each argument is cast
  // individually, so the whole call is the escape hatch here.
  const navigate = navigationRef.navigate as (...args: unknown[]) => void;

  const messageMatch = link.match(/^\/dashboard\/messages\/([^/?]+)/);
  if (messageMatch) {
    navigate("Messages", { screen: "MessageThread", params: { conversationId: messageMatch[1] } });
    return true;
  }

  if (link.startsWith("/dashboard/interviews")) {
    navigate("ProfileTab", { screen: "Interviews" });
    return true;
  }

  if (link.startsWith("/dashboard/messages")) {
    navigate("Messages", { screen: "MessagesHome" });
    return true;
  }

  return false;
}
