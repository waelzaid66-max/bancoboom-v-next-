import { useAuth } from "@clerk/expo";
import {
  registerPushToken,
  unregisterPushToken,
} from "@workspace/api-client-react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useSound } from "@/context/SoundContext";
import { routeForNotification } from "@/lib/notificationRouting";
import { getCachedPushToken, setCachedPushToken } from "@/lib/pushTokenCache";

/**
 * Remote push wiring (Task #102).
 *
 * - Registers this device's Expo push token with the backend once the user is
 *   signed in, and unregisters on sign-out (so a shared device stops receiving
 *   the previous user's pushes).
 * - Shows the banner in the foreground so an open-app user still sees a new
 *   message/reply land.
 * - Deep-links on tap using the SAME routing table as the in-app feed, for both
 *   warm taps and a cold start opened from a notification.
 *
 * Everything is best-effort and guarded: missing permission, a simulator, web,
 * Expo Go (SDK 53+), or an absent EAS projectId all degrade silently to "no
 * push" rather than crashing — the in-app feed remains the source of truth.
 */

// Expo Go (SDK 53+) removed remote-push support; importing/calling remote APIs
// there throws/logs ERROR and red-boxes. Detect Expo Go and skip the module.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Lazy-load only outside Expo Go so StoreClient never evaluates the module.
const Notifications: typeof import("expo-notifications") | null = isExpoGo
  ? null
  : (require("expo-notifications") as typeof import("expo-notifications"));

if (Notifications) {
  // Foreground presentation. SDK 53+ uses shouldShowBanner/shouldShowList.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

function platformTag(): "ios" | "android" | "web" {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

// On a cold start the router isn't mounted the instant the tap is delivered, so
// the first push() can throw. Retry a few times with a short backoff before
// giving up, so a notification tap reliably lands on the right screen instead of
// silently dropping the user on the home feed.
function navigateWhenReady(dest: Parameters<typeof router.push>[0], attempt = 0) {
  try {
    router.push(dest);
  } catch {
    if (attempt < 10) {
      setTimeout(() => navigateWhenReady(dest, attempt + 1), 250);
    }
  }
}

const handledResponseIds = new Set<string>();

type NotificationResponse = import("expo-notifications").NotificationResponse;

function handleResponse(response: NotificationResponse | null) {
  if (!response) return;
  const id = response.notification.request.identifier;
  if (id && handledResponseIds.has(id)) return;
  if (id) {
    handledResponseIds.add(id);
    // Bound memory: keep only recent ids across long sessions.
    if (handledResponseIds.size > 64) {
      const first = handledResponseIds.values().next().value;
      if (first !== undefined) handledResponseIds.delete(first);
    }
  }
  const data = (response.notification.request.content.data ?? {}) as Record<
    string,
    unknown
  >;
  const type = typeof data.type === "string" ? data.type : undefined;
  const dest = routeForNotification(type, data);
  if (!dest) return;
  navigateWhenReady(dest);
}

async function obtainExpoPushToken(): Promise<string | null> {
  // Push tokens require a physical device; web/simulators can't get one.
  if (Platform.OS === "web") return null;
  if (isExpoGo || !Notifications) return null;
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    // HIGH importance = heads-up banner + sound — the standard for
    // messaging-style pings (new message / lead / booking). DEFAULT played the
    // sound but never peeked, so users routinely missed time-sensitive alerts.
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return null;

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
      ?.eas?.projectId ?? Constants.easConfig?.projectId;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return tokenResponse.data;
}

export function PushNotificationsBridge() {
  const { isSignedIn } = useAuth();
  // The local "Push notifications" setting gates device registration: turning it
  // off unregisters this device's token (server stops pushing here); turning it
  // back on re-registers. `ready` defers the first run until the stored pref has
  // loaded, so we never register-then-immediately-unregister on cold start.
  const { notificationsEnabled, ready } = useSound();
  const tokenRef = useRef<string | null>(null);

  // Register when signed in AND notifications are enabled; otherwise unregister.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    if (isSignedIn && notificationsEnabled) {
      // NOTIF-07: retry register with backoff — single-shot was dropping cold starts.
      void (async () => {
        const delays = [0, 2000, 5000, 15000];
        let token: string | null = null;
        for (let i = 0; i < delays.length; i++) {
          if (cancelled) return;
          if (delays[i] > 0) {
            await new Promise((r) => setTimeout(r, delays[i]));
            if (cancelled) return;
          }
          try {
            if (!token) {
              token = await obtainExpoPushToken();
              if (!token) continue;
              tokenRef.current = token;
              setCachedPushToken(token);
            }
            await registerPushToken({ token, platform: platformTag() });
            return;
          } catch (err) {
            if (i === delays.length - 1) {
              console.warn("[Push] registration skipped after retries:", err);
            }
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    // Mute (or signed-out): clear server registration. Cold start after kill
    // leaves tokenRef empty even when AsyncStorage says muted — re-resolve
    // the device token while still authenticated, then unregister.
    if (isSignedIn && !notificationsEnabled) {
      const known = tokenRef.current ?? getCachedPushToken();
      tokenRef.current = null;
      setCachedPushToken(null);
      const unregister = (token: string) => {
        if (cancelled) return;
        unregisterPushToken({ token }).catch(() => {});
      };
      if (known) {
        unregister(known);
      } else {
        obtainExpoPushToken()
          .then((token) => {
            if (token) unregister(token);
          })
          .catch(() => {});
      }
    } else {
      // Signed out — local clear only. Caller must unregister BEFORE signOut
      // (otherwise this would 401 with a dead session).
      tokenRef.current = null;
      setCachedPushToken(null);
    }

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, notificationsEnabled, ready]);

  // Deep-link on tap: cold start (opened from a notification) + warm taps.
  useEffect(() => {
    if (isExpoGo || !Notifications) return;
    Notifications.getLastNotificationResponseAsync()
      .then(handleResponse)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, []);

  return null;
}
