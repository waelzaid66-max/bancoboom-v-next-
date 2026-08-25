import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * WHERE A SIGNED-OUT USER WAS TRYING TO GO BEFORE BEING SENT TO SIGN IN.
 *
 * Recovered 2026-08-25 from `banco.store`, which is a separate lineage — it
 * shares no commit with this repository, so this module was invisible to a
 * path+content inventory and surfaced only through an exported-symbol sweep
 * (VNX-RECON-01).
 *
 * What was measured before restoring it: `app/(tabs)/profile.tsx` reads only
 * `authMode` from its params and pushes to the onboarding href after a
 * successful auth. Nothing carried an intended target, so a user who deep-links
 * to a listing, is sent to sign in, and succeeds landed on the profile tab
 * rather than the listing. The server was never at risk — `requireAuth` guards
 * conversations, bookings and import-orders — so this is a journey defect, not
 * a security one.
 *
 * Persisted to disk because an OAuth / in-app-browser round trip can recreate
 * JS state, with an in-memory mirror for the common same-process flow.
 */
const PENDING_KEY = "banco_pending_auth_redirect_v1";

let memoryTarget: string | null = null;

/**
 * The only routes a signed-out user may reach: the auth screen (the Profile
 * tab, which renders the full sign-in / sign-up experience) and the legal pages
 * (kept public for app-store compliance).
 *
 * `pathname` is the expo-router path with group segments stripped, e.g. the
 * Profile tab is `/profile` and legal is `/legal/privacy`.
 */
export function isAllowedSignedOutPath(pathname: string): boolean {
  if (pathname === "/profile") return true;
  return pathname === "/legal" || pathname.startsWith("/legal/");
}

/**
 * Whether a push notification's destination needs a signed-in session.
 *
 * Recovered from `aws-virgen` in the same sweep, and kept beside
 * `isAllowedSignedOutPath` because both answer one question — what may a
 * signed-out user reach — and separating them is how they drifted apart.
 * Public listing detail is the only push destination a guest may open.
 */
export function notificationRequiresAuth(dest: string): boolean {
  if (!dest) return true;
  return !(dest === "/listing" || dest.startsWith("/listing/"));
}

/** Remember the intended target so we can return there after sign-in. */
export async function savePendingAuthRedirect(href: string): Promise<void> {
  memoryTarget = href;
  try {
    await AsyncStorage.setItem(PENDING_KEY, href);
  } catch {
    // best-effort — the in-memory mirror still covers the same-process flow
  }
}

/** Read and clear the pending redirect (returns null when there is none). */
export async function consumePendingAuthRedirect(): Promise<string | null> {
  let target = memoryTarget;
  if (!target) {
    try {
      target = await AsyncStorage.getItem(PENDING_KEY);
    } catch {
      target = null;
    }
  }
  memoryTarget = null;
  try {
    await AsyncStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore — clearing is best-effort
  }
  return target ?? null;
}
