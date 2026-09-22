import { useEffect } from "react";
import { Platform, Linking } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { config } from "./config";

export const PUSH_TOKEN_KEY = "ipskill_expo_push_token";

// Foreground behavior — without this, a notification that arrives while
// the app is already open is silently swallowed rather than shown.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers this device for Expo push notifications once signed in, and
 * opens whatever the notification's `link` points at (a relative web path
 * — Messages, Analytics, etc.) when the user taps it. The mobile app has
 * no native screens of its own for messages/shortlists/analytics yet, so
 * this opens the equivalent web page rather than trying to deep-link into
 * a screen that doesn't exist — a pragmatic stopgap until those get a
 * native equivalent.
 *
 * `getExpoPushTokenAsync` needs an EAS `projectId` to work outside of a
 * bare/dev-client build — this app has no EAS project configured yet
 * (see app.json), so registration will throw and this silently no-ops
 * until one exists. Remote push is also unsupported in Expo Go on Android
 * since SDK 49, so this is best-effort even once a project id is set,
 * same class of limitation as the GitHub/Google/LinkedIn OAuth apps this
 * codebase already treats as "needs a real one, not fakeable in a
 * sandbox."
 */
export function usePushNotifications(accessToken: string | null) {
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    async function register() {
      if (!Device.isDevice) return; // simulators/emulators never get a real token

      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== "granted") return;

      let expoPushToken: string;
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const result = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        expoPushToken = result.data;
      } catch {
        return;
      }
      if (cancelled) return;

      try {
        await fetch(`${config.authBackendUrl}/api/mobile/push-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, expoPushToken, platform: Platform.OS }),
        });
        // Stashed so sign-out (see auth-context.tsx) can unregister this
        // exact token without needing this hook's in-memory state.
        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, expoPushToken);
      } catch {
        // best-effort — a failed registration just means no push this session
      }
    }

    register();

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const link = response.notification.request.content.data?.link;
      if (typeof link === "string") {
        Linking.openURL(`${config.authBackendUrl}${link}`);
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [accessToken]);
}
