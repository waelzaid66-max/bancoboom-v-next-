import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import {
  getGetMessagesQueryKey,
  getListConversationsQueryKey,
  sendMessage,
  type GetMessages200,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useBiometric } from "@/context/BiometricContext";
import {
  assertMessageTextOutboxCapacity,
  classifyMessageTextOutboxError,
  clerkTokenBelongsToUser,
  createMessageTextOutboxEntry,
  eligibleMessageTextOutboxEntry,
  messageOutboxOwnerFromStorageKey,
  messageOutboxStorageKey,
  nextMessageTextOutboxDelay,
  parseMessageTextOutbox,
  serializeMessageTextOutbox,
  type MessageTextOutboxEntry,
} from "@/lib/messageTextOutbox";

export { messageOutboxStorageKey } from "@/lib/messageTextOutbox";
export type { MessageTextOutboxEntry } from "@/lib/messageTextOutbox";

const SEND_TIMEOUT_MS = 15_000;
const ACK_STORAGE_RETRY_MS = [2_000, 5_000, 15_000, 30_000, 60_000, 300_000];

type EnqueueTextInput = {
  conversationId: string;
  clientMessageId: string;
  body: string;
};

type MessageOutboxContextValue = {
  hydrated: boolean;
  entries: MessageTextOutboxEntry[];
  enqueueText: (input: EnqueueTextInput) => Promise<string>;
  retry: (clientMessageId: string) => Promise<void>;
  discard: (clientMessageId: string) => Promise<void>;
  prepareForSignOut: () => Promise<void>;
  resumeAfterSignOutFailure: () => void;
  suspendForAccountDeletion: () => Promise<void>;
  resumeAfterAccountDeletionFailure: () => void;
  purgeAfterAccountDeletion: () => Promise<void>;
};

type AuthSnapshot = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  getToken: () => Promise<string | null>;
};

const MessageOutboxContext = createContext<MessageOutboxContextValue | undefined>(
  undefined,
);

function abortError(): Error {
  return Object.assign(new Error("Message outbox identity changed."), {
    name: "AbortError",
  });
}

function sameIdentity(
  current: AuthSnapshot,
  expected: Pick<AuthSnapshot, "userId" | "sessionId">,
): boolean {
  return (
    current.isLoaded &&
    current.isSignedIn &&
    current.userId === expected.userId &&
    current.sessionId === expected.sessionId
  );
}

function replaceEntry(
  entries: MessageTextOutboxEntry[],
  clientMessageId: string,
  update: (entry: MessageTextOutboxEntry) => MessageTextOutboxEntry,
): MessageTextOutboxEntry[] {
  return entries.map((entry) =>
    entry.clientMessageId === clientMessageId ? update(entry) : entry,
  );
}

function nextWakeDelay(entries: MessageTextOutboxEntry[], now: number): number | null {
  const heads = new Map<string, MessageTextOutboxEntry>();
  for (const entry of entries) {
    if (!heads.has(entry.conversationId)) heads.set(entry.conversationId, entry);
  }
  const future = [...heads.values()]
    .filter(
      (entry) =>
        entry.state !== "failed" &&
        entry.autoRetryUntil >= now &&
        entry.nextAttemptAt > now,
    )
    .map((entry) => entry.nextAttemptAt);
  if (future.length === 0) return null;
  return Math.max(0, Math.min(...future) - now);
}

function acknowledgementCleanupError(error: unknown, attempt: number): Error {
  const delay = ACK_STORAGE_RETRY_MS[
    Math.min(Math.max(attempt - 1, 0), ACK_STORAGE_RETRY_MS.length - 1)
  ];
  return Object.assign(new Error("Message acknowledgement cleanup deferred."), {
    cause: error,
    outboxStorageRetryMs: delay,
  });
}

async function sanitizeAndRemoveStoredOutbox(ownerUserId: string): Promise<void> {
  const key = messageOutboxStorageKey(ownerUserId);
  let sanitized = false;
  let lastError: unknown;
  try {
    await AsyncStorage.setItem(
      key,
      serializeMessageTextOutbox(ownerUserId, [], Date.now()),
    );
    sanitized = true;
  } catch (error) {
    lastError = error;
  }
  try {
    await AsyncStorage.removeItem(key);
    return;
  } catch (error) {
    lastError = error;
  }
  if (sanitized) return;
  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to clear the Messenger outbox.");
}

export function MessageOutboxProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const biometric = useBiometric();
  const queryClient = useQueryClient();
  const authRef = useRef<AuthSnapshot>({
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn ?? false,
    userId: auth.userId ?? null,
    sessionId: auth.sessionId ?? null,
    getToken: auth.getToken,
  });
  authRef.current = {
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn ?? false,
    userId: auth.userId ?? null,
    sessionId: auth.sessionId ?? null,
    getToken: auth.getToken,
  };

  const [entries, setEntries] = useState<MessageTextOutboxEntry[]>([]);
  const [hydratedOwner, setHydratedOwner] = useState<string | null>(null);
  const entriesRef = useRef<MessageTextOutboxEntry[]>([]);
  const ownerRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const suspendedRef = useRef(false);
  const purgingRef = useRef(false);
  const storageTailRef = useRef<Promise<void>>(Promise.resolve());
  const flushPromiseRef = useRef<Promise<void> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const acknowledgedRef = useRef(new Set<string>());
  const acknowledgementCleanupAttemptsRef = useRef(new Map<string, number>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drainRef = useRef<() => Promise<void>>(async () => {});
  const appStateRef = useRef(AppState.currentState);
  const mountedRef = useRef(true);
  const biometricRef = useRef({ hydrated: biometric.hydrated, locked: biometric.locked });
  biometricRef.current = { hydrated: biometric.hydrated, locked: biometric.locked };

  const publish = useCallback((next: MessageTextOutboxEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
  }, []);

  const queueStorage = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const run = storageTailRef.current.then(operation, operation);
    storageTailRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const persist = useCallback(
    async (ownerUserId: string, next: MessageTextOutboxEntry[]) => {
      const key = messageOutboxStorageKey(ownerUserId);
      if (next.length === 0) {
        await sanitizeAndRemoveStoredOutbox(ownerUserId);
      } else {
        await AsyncStorage.setItem(
          key,
          serializeMessageTextOutbox(ownerUserId, next, Date.now()),
        );
      }
    },
    [],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const scheduleDrain = useCallback(
    (delay = 0) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void drainRef.current().catch((error) => {
          if (__DEV__) console.warn("[MessageOutbox] drain deferred", error);
        });
      }, Math.max(0, delay));
    },
    [clearTimer],
  );

  const purgeStoredOwner = useCallback(async (ownerUserId: string) => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await sanitizeAndRemoveStoredOutbox(ownerUserId);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Unable to purge the Messenger outbox.");
  }, []);

  const purgeForeignStoredOwners = useCallback(
    async (activeOwner: string | null) => {
      const keys = await AsyncStorage.getAllKeys();
      for (const key of keys) {
        const ownerUserId = messageOutboxOwnerFromStorageKey(key);
        if (!ownerUserId || ownerUserId === activeOwner) continue;
        await purgeStoredOwner(ownerUserId);
      }
    },
    [purgeStoredOwner],
  );

  const authReadyForOwner = useCallback((ownerUserId: string): boolean => {
    const current = authRef.current;
    return Boolean(
      current.isLoaded &&
        current.isSignedIn &&
        current.userId === ownerUserId &&
        current.sessionId,
    );
  }, []);

  const processingReady = useCallback((ownerUserId: string): boolean => {
    return Boolean(
      !suspendedRef.current &&
        mountedRef.current &&
        ownerRef.current === ownerUserId &&
        authReadyForOwner(ownerUserId) &&
        biometricRef.current.hydrated &&
        !biometricRef.current.locked &&
        appStateRef.current === "active",
    );
  }, [authReadyForOwner]);

  const commitEntries = useCallback(
    async (
      ownerUserId: string,
      build: (current: MessageTextOutboxEntry[]) => MessageTextOutboxEntry[],
    ) =>
      queueStorage(async () => {
        if (ownerRef.current !== ownerUserId) throw abortError();
        const next = build(entriesRef.current);
        await persist(ownerUserId, next);
        if (ownerRef.current !== ownerUserId) throw abortError();
        publish(next);
        return next;
      }),
    [persist, publish, queueStorage],
  );

  const seedAcknowledgement = useCallback(
    (entry: MessageTextOutboxEntry, response: Awaited<ReturnType<typeof sendMessage>>) => {
      const echo = response.data;
      if (!echo) return;
      queryClient.setQueriesData<GetMessages200>(
        { queryKey: getGetMessagesQueryKey(entry.conversationId), exact: false },
        (previous) => {
          if (!previous) return previous;
          const current = previous.data ?? [];
          if (current.some((message) => message.id === echo.id)) return previous;
          const data = [...current, echo];
          return {
            data,
            error: null,
            meta: { ...(previous.meta ?? {}), total: data.length },
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    },
    [queryClient],
  );

  const markAfterAbort = useCallback(
    async (entry: MessageTextOutboxEntry) => {
      if (
        !mountedRef.current ||
        purgingRef.current ||
        ownerRef.current !== entry.ownerUserId
      ) {
        return;
      }
      await commitEntries(entry.ownerUserId, (current) =>
        replaceEntry(current, entry.clientMessageId, (item) => ({
          ...item,
          attemptCount: Math.max(0, item.attemptCount - 1),
          state: "queued",
          holdReason: null,
          nextAttemptAt: Date.now(),
        })),
      );
    },
    [commitEntries],
  );

  const processEntry = useCallback(
    async (entry: MessageTextOutboxEntry) => {
      const generation = generationRef.current;
      const snapshot = authRef.current;
      if (
        !processingReady(entry.ownerUserId) ||
        !sameIdentity(snapshot, {
          userId: entry.ownerUserId,
          sessionId: snapshot.sessionId,
        })
      ) {
        return;
      }

      if (acknowledgedRef.current.has(entry.clientMessageId)) {
        try {
          await commitEntries(entry.ownerUserId, (current) =>
            current.filter(
              (item) => item.clientMessageId !== entry.clientMessageId,
            ),
          );
          acknowledgedRef.current.delete(entry.clientMessageId);
          acknowledgementCleanupAttemptsRef.current.delete(entry.clientMessageId);
        } catch (error) {
          const attempt =
            (acknowledgementCleanupAttemptsRef.current.get(entry.clientMessageId) ??
              0) + 1;
          acknowledgementCleanupAttemptsRef.current.set(
            entry.clientMessageId,
            attempt,
          );
          throw acknowledgementCleanupError(error, attempt);
        }
        return;
      }

      const attemptNumber = entry.attemptCount + 1;
      await commitEntries(entry.ownerUserId, (current) =>
        replaceEntry(current, entry.clientMessageId, (item) => ({
          ...item,
          attemptCount: attemptNumber,
          state: "retrying",
          holdReason: null,
          lastStatus: null,
        })),
      );

      let token: string | null;
      try {
        token = await snapshot.getToken();
      } catch (error) {
        token = null;
        if (generationRef.current !== generation) {
          await markAfterAbort(entry);
          return;
        }
        if (__DEV__) console.warn("[MessageOutbox] Clerk token unavailable", error);
      }

      if (
        generationRef.current !== generation ||
        !sameIdentity(authRef.current, snapshot) ||
        !processingReady(entry.ownerUserId)
      ) {
        await markAfterAbort(entry);
        return;
      }

      if (!token || !clerkTokenBelongsToUser(token, entry.ownerUserId)) {
        await commitEntries(entry.ownerUserId, (current) =>
          replaceEntry(current, entry.clientMessageId, (item) => ({
            ...item,
            state: "failed",
            holdReason: "auth",
            lastStatus: 401,
          })),
        );
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, SEND_TIMEOUT_MS);

      let response: Awaited<ReturnType<typeof sendMessage>> | null = null;
      try {
        let rejectOnAbort!: (error: Error) => void;
        const abortBarrier = new Promise<never>((_resolve, reject) => {
          rejectOnAbort = reject;
        });
        const rejectAbortedTransport = () => rejectOnAbort(abortError());
        controller.signal.addEventListener("abort", rejectAbortedTransport, {
          once: true,
        });
        try {
          response = await Promise.race([
            sendMessage(
              entry.conversationId,
              { body: entry.body, client_message_id: entry.clientMessageId },
              {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal,
              },
            ),
            abortBarrier,
          ]);
        } finally {
          controller.signal.removeEventListener("abort", rejectAbortedTransport);
        }
      } catch (rawError) {
        if (
          generationRef.current !== generation ||
          purgingRef.current ||
          ownerRef.current !== entry.ownerUserId ||
          !sameIdentity(authRef.current, snapshot)
        ) {
          return;
        }
        const error = timedOut
          ? Object.assign(new TypeError("Message send timed out."), { cause: rawError })
          : rawError;
        const decision = classifyMessageTextOutboxError(error);
        if (decision.kind === "abort") {
          await markAfterAbort(entry);
          return;
        }
        if (decision.kind === "auth") {
          await commitEntries(entry.ownerUserId, (current) =>
            replaceEntry(current, entry.clientMessageId, (item) => ({
              ...item,
              state: "failed",
              holdReason: "auth",
              lastStatus: decision.status,
            })),
          );
          return;
        }
        if (decision.kind === "permanent") {
          await commitEntries(entry.ownerUserId, (current) =>
            replaceEntry(current, entry.clientMessageId, (item) => ({
              ...item,
              state: "failed",
              holdReason: "permanent",
              lastStatus: decision.status,
            })),
          );
          return;
        }
        const delay = Math.max(
          nextMessageTextOutboxDelay(attemptNumber),
          decision.retryAfterMs ?? 0,
        );
        await commitEntries(entry.ownerUserId, (current) =>
          replaceEntry(current, entry.clientMessageId, (item) => ({
            ...item,
            state: "queued",
            holdReason: null,
            lastStatus: decision.status,
            nextAttemptAt: Date.now() + delay,
          })),
        );
      } finally {
        clearTimeout(timeout);
        if (abortRef.current === controller) abortRef.current = null;
      }

      // A transport may resolve after its AbortSignal was ignored. Never let a
      // late A acknowledgement write into B's shared query cache or recreate a
      // queue after logout/delete.
      if (
        generationRef.current !== generation ||
        purgingRef.current ||
        ownerRef.current !== entry.ownerUserId ||
        !sameIdentity(authRef.current, snapshot)
      ) {
        return;
      }
      if (!response) return;

      if (
        response.data?.client_message_id !== entry.clientMessageId ||
        response.data?.conversation_id !== entry.conversationId
      ) {
        await commitEntries(entry.ownerUserId, (current) =>
          replaceEntry(current, entry.clientMessageId, (item) => ({
            ...item,
            state: "failed",
            holdReason: "protocol",
            lastStatus: null,
          })),
        );
        return;
      }

      // Commit the durable removal before painting the server echo. A local
      // storage failure now escapes to the drain boundary and retries this same
      // UUID later instead of being misclassified as a transport error.
      acknowledgedRef.current.add(entry.clientMessageId);
      try {
        await commitEntries(entry.ownerUserId, (current) =>
          current.filter((item) => item.clientMessageId !== entry.clientMessageId),
        );
        acknowledgedRef.current.delete(entry.clientMessageId);
        acknowledgementCleanupAttemptsRef.current.delete(entry.clientMessageId);
      } catch (error) {
        acknowledgementCleanupAttemptsRef.current.set(entry.clientMessageId, 1);
        throw acknowledgementCleanupError(error, 1);
      }
      if (
        generationRef.current === generation &&
        !purgingRef.current &&
        ownerRef.current === entry.ownerUserId &&
        sameIdentity(authRef.current, snapshot)
      ) {
        seedAcknowledgement(entry, response);
      }
    }, [commitEntries, markAfterAbort, processingReady, seedAcknowledgement]);

  drainRef.current = async () => {
    if (flushPromiseRef.current) return flushPromiseRef.current;
    const ownerUserId = ownerRef.current;
    if (!ownerUserId || !processingReady(ownerUserId)) return;

    const run = (async () => {
      while (processingReady(ownerUserId)) {
        const now = Date.now();
        const entry = eligibleMessageTextOutboxEntry(entriesRef.current, now);
        if (!entry) {
          const delay = nextWakeDelay(entriesRef.current, now);
          if (delay !== null) scheduleDrain(delay);
          break;
        }
        try {
          await processEntry(entry);
        } catch (error) {
          if (__DEV__) console.warn("[MessageOutbox] local queue write deferred", error);
          const requestedDelay =
            error &&
            typeof error === "object" &&
            typeof (error as { outboxStorageRetryMs?: unknown })
              .outboxStorageRetryMs === "number"
              ? (error as { outboxStorageRetryMs: number }).outboxStorageRetryMs
              : 2_000;
          if (processingReady(ownerUserId)) scheduleDrain(requestedDelay);
          break;
        }
      }
    })();
    flushPromiseRef.current = run;
    try {
      await run;
    } finally {
      if (flushPromiseRef.current === run) flushPromiseRef.current = null;
    }
  };

  useEffect(() => {
    const current = authRef.current;
    generationRef.current += 1;
    acknowledgedRef.current.clear();
    acknowledgementCleanupAttemptsRef.current.clear();
    abortRef.current?.abort();
    abortRef.current = null;
    clearTimer();
    setHydratedOwner(null);
    publish([]);

    if (!current.isLoaded) return;

    const previousOwner = ownerRef.current;
    if (!current.isSignedIn || !current.userId || !current.sessionId) {
      ownerRef.current = null;
      void queueStorage(async () => {
        if (previousOwner) await purgeStoredOwner(previousOwner);
        await purgeForeignStoredOwners(null);
      }).catch((error) => {
        if (__DEV__) console.warn("[MessageOutbox] signed-out purge deferred", error);
      });
      return;
    }

    const ownerUserId = current.userId;
    const generation = generationRef.current;
    ownerRef.current = ownerUserId;
    suspendedRef.current = false;
    purgingRef.current = false;
    void queueStorage(async () => {
      if (previousOwner && previousOwner !== ownerUserId) {
        try {
          await purgeStoredOwner(previousOwner);
        } catch (error) {
          if (__DEV__) console.warn("[MessageOutbox] previous owner purge deferred", error);
        }
      }
      try {
        await purgeForeignStoredOwners(ownerUserId);
      } catch (error) {
        if (__DEV__) console.warn("[MessageOutbox] foreign owner purge deferred", error);
      }
      const raw = await AsyncStorage.getItem(messageOutboxStorageKey(ownerUserId));
      let restored = parseMessageTextOutbox(raw, ownerUserId, Date.now());
      // A refreshed Clerk session may safely release auth-held entries for the
      // same owner. They still pass the explicit-token subject check before POST.
      restored = restored.map((entry) =>
        entry.holdReason === "auth"
          ? {
              ...entry,
              state: "queued" as const,
              holdReason: null,
              nextAttemptAt: Date.now(),
            }
          : entry,
      );
      if (raw && restored.length === 0) {
        await purgeStoredOwner(ownerUserId);
      } else if (restored.length > 0) {
        await persist(ownerUserId, restored);
      }
      if (
        generationRef.current !== generation ||
        ownerRef.current !== ownerUserId ||
        !sameIdentity(authRef.current, current)
      ) {
        return;
      }
      publish(restored);
      setHydratedOwner(ownerUserId);
      scheduleDrain();
    }).catch((error) => {
      if (__DEV__) console.warn("[MessageOutbox] hydration deferred", error);
    });
  }, [
    auth.isLoaded,
    auth.isSignedIn,
    auth.userId,
    auth.sessionId,
    clearTimer,
    persist,
    publish,
    purgeForeignStoredOwners,
    purgeStoredOwner,
    queueStorage,
    scheduleDrain,
  ]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      appStateRef.current = state;
      if (state === "active") {
        scheduleDrain();
      } else {
        clearTimer();
        abortRef.current?.abort();
      }
    };
    const subscription = AppState.addEventListener("change", onChange);
    const currentState = AppState.currentState;
    if (currentState) onChange(currentState);
    return () => subscription.remove();
  }, [clearTimer, scheduleDrain]);

  useEffect(() => {
    if (biometric.hydrated && !biometric.locked) {
      scheduleDrain();
    } else {
      clearTimer();
      abortRef.current?.abort();
    }
  }, [biometric.hydrated, biometric.locked, clearTimer, scheduleDrain]);

  useEffect(() => {
    // React StrictMode intentionally mounts, cleans up, and mounts effects
    // again in development. Restore the liveness flag on every effect mount so
    // that the second pass cannot leave the singleton processor disabled.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      clearTimer();
      abortRef.current?.abort();
    };
  }, [clearTimer]);

  const enqueueText = useCallback(
    async (input: EnqueueTextInput): Promise<string> => {
      const current = authRef.current;
      const ownerUserId = current.userId;
      if (
        !current.isLoaded ||
        !current.isSignedIn ||
        !ownerUserId ||
        !current.sessionId ||
        hydratedOwner !== ownerUserId ||
        ownerRef.current !== ownerUserId
      ) {
        throw new Error("Message outbox is not ready for this account.");
      }
      const entry = createMessageTextOutboxEntry({
        ownerUserId,
        clientMessageId: input.clientMessageId,
        conversationId: input.conversationId,
        body: input.body,
        now: Date.now(),
      });
      await queueStorage(async () => {
        if (!sameIdentity(authRef.current, current) || ownerRef.current !== ownerUserId) {
          throw abortError();
        }
        assertMessageTextOutboxCapacity(entriesRef.current, entry.body);
        if (
          entriesRef.current.some(
            (item) => item.clientMessageId === entry.clientMessageId,
          )
        ) {
          throw new Error("Message outbox already contains this UUID.");
        }
        const next = [...entriesRef.current, entry];
        await persist(ownerUserId, next);
        if (!sameIdentity(authRef.current, current) || ownerRef.current !== ownerUserId) {
          throw abortError();
        }
        publish(next);
      });
      scheduleDrain();
      return entry.clientMessageId;
    }, [hydratedOwner, persist, publish, queueStorage, scheduleDrain],
  );

  const retry = useCallback(
    async (clientMessageId: string) => {
      const ownerUserId = ownerRef.current;
      if (!ownerUserId || hydratedOwner !== ownerUserId) return;
      await commitEntries(ownerUserId, (current) =>
        replaceEntry(current, clientMessageId, (entry) => ({
          ...entry,
          state: "queued",
          holdReason: null,
          lastStatus: null,
          nextAttemptAt: Date.now(),
          autoRetryUntil: Date.now() + 24 * 60 * 60 * 1000,
        })),
      );
      scheduleDrain();
    }, [commitEntries, hydratedOwner, scheduleDrain],
  );

  const discard = useCallback(
    async (clientMessageId: string) => {
      const ownerUserId = ownerRef.current;
      if (!ownerUserId || hydratedOwner !== ownerUserId) return;
      await commitEntries(ownerUserId, (current) =>
        current.filter((entry) => entry.clientMessageId !== clientMessageId),
      );
      scheduleDrain();
    }, [commitEntries, hydratedOwner, scheduleDrain],
  );

  const prepareForSignOut = useCallback(async () => {
    const ownerUserId = ownerRef.current;
    const activeFlush = flushPromiseRef.current;
    purgingRef.current = true;
    suspendedRef.current = true;
    generationRef.current += 1;
    clearTimer();
    abortRef.current?.abort();
    abortRef.current = null;
    await activeFlush?.catch(() => {});
    if (ownerUserId) {
      await queueStorage(() => purgeStoredOwner(ownerUserId));
    }
    if (ownerRef.current === ownerUserId) {
      acknowledgedRef.current.clear();
      acknowledgementCleanupAttemptsRef.current.clear();
      publish([]);
      setHydratedOwner(null);
    }
  }, [clearTimer, publish, purgeStoredOwner, queueStorage]);

  const resumeAfterSignOutFailure = useCallback(() => {
    const current = authRef.current;
    if (
      !current.isLoaded ||
      !current.isSignedIn ||
      !current.userId ||
      !current.sessionId ||
      ownerRef.current !== current.userId
    ) {
      return;
    }
    purgingRef.current = false;
    suspendedRef.current = false;
    setHydratedOwner(current.userId);
    scheduleDrain();
  }, [scheduleDrain]);

  const suspendForAccountDeletion = useCallback(async () => {
    const activeFlush = flushPromiseRef.current;
    suspendedRef.current = true;
    generationRef.current += 1;
    clearTimer();
    abortRef.current?.abort();
    abortRef.current = null;
    await activeFlush?.catch(() => {});
  }, [clearTimer]);

  const resumeAfterAccountDeletionFailure = useCallback(() => {
    if (purgingRef.current) return;
    purgingRef.current = false;
    suspendedRef.current = false;
    scheduleDrain();
  }, [scheduleDrain]);

  const value = useMemo<MessageOutboxContextValue>(
    () => ({
      hydrated: Boolean(
        auth.isLoaded && auth.userId && hydratedOwner === auth.userId,
      ),
      entries:
        auth.isLoaded && auth.userId
          ? entries.filter((entry) => entry.ownerUserId === auth.userId)
          : [],
      enqueueText,
      retry,
      discard,
      prepareForSignOut,
      resumeAfterSignOutFailure,
      suspendForAccountDeletion,
      resumeAfterAccountDeletionFailure,
      purgeAfterAccountDeletion: prepareForSignOut,
    }),
    [
      auth.isLoaded,
      auth.userId,
      discard,
      enqueueText,
      entries,
      hydratedOwner,
      prepareForSignOut,
      resumeAfterSignOutFailure,
      resumeAfterAccountDeletionFailure,
      retry,
      suspendForAccountDeletion,
    ],
  );

  return (
    <MessageOutboxContext.Provider value={value}>
      {children}
    </MessageOutboxContext.Provider>
  );
}

export function useMessageOutbox(): MessageOutboxContextValue {
  const context = useContext(MessageOutboxContext);
  if (!context) {
    throw new Error("useMessageOutbox must be used within MessageOutboxProvider");
  }
  return context;
}
