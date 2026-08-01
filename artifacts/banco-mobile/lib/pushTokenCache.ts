/**
 * Process-local cache of the Expo push token registered by PushNotificationsBridge.
 * Sign-out paths unregister WHILE the Clerk session is still valid — the effect
 * that reacts to isSignedIn=false often 401s after auth death.
 */
let cachedPushToken: string | null = null;

export function setCachedPushToken(token: string | null): void {
  cachedPushToken = token;
}

export function getCachedPushToken(): string | null {
  return cachedPushToken;
}
