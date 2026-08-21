import { useAuth } from "@clerk/expo";
import { updateMe } from "@workspace/api-client-react";
import { useCallback, useEffect, useRef } from "react";

import { useI18n } from "@/context/LanguageContext";
import type { Lang } from "@/constants/i18n";

type DesiredSync = {
  key: string;
  userId: string;
  lang: Lang;
};

const RETRY_DELAYS_MS = [0, 500, 2_000] as const;

function delay(ms: number): Promise<void> {
  if (ms === 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status !== "number" || status === 429 || status >= 500;
}

/**
 * Mirrors the local language preference to the authenticated user's DB row.
 *
 * The worker is deliberately serialized. If the user toggles quickly, an older
 * PATCH must finish before the newer preference is sent, so a slow response can
 * never leave the server on the stale language. Local UI and AsyncStorage remain
 * immediate and independent of this best-effort server channel.
 */
export function LanguagePreferenceSync() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { lang, ready } = useI18n();
  const mountedRef = useRef(true);
  const runningRef = useRef(false);
  const desiredRef = useRef<DesiredSync | null>(null);
  const syncedKeyRef = useRef<string | null>(null);
  const failedKeyRef = useRef<string | null>(null);
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(
    () => () => {
      mountedRef.current = false;
      desiredRef.current = null;
    },
    [],
  );

  const drain = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      while (mountedRef.current) {
        const desired = desiredRef.current;
        if (
          !desired ||
          syncedKeyRef.current === desired.key ||
          failedKeyRef.current === desired.key
        ) {
          break;
        }

        let outcome: "synced" | "failed" | "superseded" = "failed";
        let lastError: unknown;

        for (const retryDelay of RETRY_DELAYS_MS) {
          await delay(retryDelay);
          if (!mountedRef.current || desiredRef.current?.key !== desired.key) {
            outcome = "superseded";
            break;
          }

          const token = await getTokenRef.current().catch((error) => {
            lastError = error;
            return null;
          });
          if (!token) continue;
          if (!mountedRef.current || desiredRef.current?.key !== desired.key) {
            outcome = "superseded";
            break;
          }

          try {
            await updateMe(
              { language: desired.lang },
              { headers: { Authorization: `Bearer ${token}` } },
            );
            outcome = "synced";
            break;
          } catch (error) {
            lastError = error;
            if (!isRetryable(error)) break;
          }
        }

        if (outcome === "synced") {
          syncedKeyRef.current = desired.key;
        } else if (outcome === "failed") {
          failedKeyRef.current = desired.key;
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.warn(
              `[BANCO] Could not sync language for ${desired.userId}; local preference remains active.`,
              lastError,
            );
          }
        }
      }
    } finally {
      runningRef.current = false;
      const latest = desiredRef.current;
      if (
        mountedRef.current &&
        latest &&
        syncedKeyRef.current !== latest.key &&
        failedKeyRef.current !== latest.key
      ) {
        void drain();
      }
    }
  }, []);

  useEffect(() => {
    if (!ready || !isLoaded || !isSignedIn || !userId) {
      desiredRef.current = null;
      if (!isSignedIn || !userId) {
        syncedKeyRef.current = null;
        failedKeyRef.current = null;
      }
      return;
    }

    const next = { key: `${userId}:${lang}`, userId, lang };
    desiredRef.current = next;
    if (failedKeyRef.current !== next.key) failedKeyRef.current = null;
    void drain();
  }, [drain, isLoaded, isSignedIn, lang, ready, userId]);

  return null;
}
