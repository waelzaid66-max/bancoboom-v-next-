import { unregisterPushToken } from "@workspace/api-client-react";

import { getCachedPushToken, setCachedPushToken } from "@/lib/pushTokenCache";

/**
 * Best-effort device unregister while auth is still alive. Never throws —
 * callers must still proceed to signOut even if Expo/network fails.
 */
export async function unregisterCachedPushTokenBestEffort(): Promise<void> {
  const token = getCachedPushToken();
  if (!token) return;
  try {
    await unregisterPushToken({ token });
  } catch {
    // Session may already be dying; orphaned rows are pruned on DeviceNotRegistered.
  } finally {
    setCachedPushToken(null);
  }
}
