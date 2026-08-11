import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sendMessage } from "@workspace/api-client-react";
import { act, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { AppState, Text, View } from "react-native";

import {
  MessageOutboxProvider,
  messageOutboxStorageKey,
  useMessageOutbox,
} from "@/context/MessageOutboxContext";
import {
  createMessageTextOutboxEntry,
  parseMessageTextOutbox,
  serializeMessageTextOutbox,
} from "@/lib/messageTextOutbox";

type MockAuth = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  getToken: jest.Mock<Promise<string | null>, []>;
};

let mockAuth: MockAuth;

jest.mock("@clerk/expo", () => ({
  useAuth: jest.fn(() => mockAuth),
}));

jest.mock("@workspace/api-client-react", () => ({
  sendMessage: jest.fn(),
  getGetMessagesQueryKey: (id: string) => [`/api/v1/conversations/${id}/messages`],
  getListConversationsQueryKey: () => ["/api/v1/conversations"],
}));

jest.mock("@/context/BiometricContext", () => ({
  useBiometric: () => ({ hydrated: true, locked: false }),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockSendMessage = sendMessage as jest.Mock;

function jwtFor(userId: string): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "none" })}.${encode({ sub: userId })}.test-signature`;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type OutboxApi = ReturnType<typeof useMessageOutbox>;
let outbox!: OutboxApi;

function Harness() {
  outbox = useMessageOutbox();
  return (
    <View>
      <Text testID="outbox-hydrated">{String(outbox.hydrated)}</Text>
      <Text testID="outbox-count">{String(outbox.entries.length)}</Text>
      <Text testID="outbox-status">
        {outbox.entries.map((entry) => entry.state).join(",")}
      </Text>
    </View>
  );
}

function Root({ client }: { client: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <MessageOutboxProvider>
        <Harness />
      </MessageOutboxProvider>
    </QueryClientProvider>
  );
}

function signedInAuth(userId: string, token = jwtFor(userId)): MockAuth {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId,
    sessionId: `session-${userId}`,
    getToken: jest.fn(async () => token),
  };
}

async function renderLoaded(client = new QueryClient()) {
  const view = render(<Root client={client} />);
  await waitFor(() => expect(outbox.hydrated).toBe(true));
  return view;
}

describe("MessageOutboxProvider", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(AppState, "currentState", {
      configurable: true,
      value: "active",
    });
    mockAuth = signedInAuth("user-A");
    mockUseAuth.mockImplementation(() => mockAuth);
    mockSendMessage.mockImplementation(
      async (conversationId: string, body: { client_message_id: string }) => ({
        data: {
          id: `server-${body.client_message_id}`,
          conversation_id: conversationId,
          client_message_id: body.client_message_id,
        },
      }),
    );
  });

  it("persists the immutable attempt before opening the transport", async () => {
    await renderLoaded();
    const storageWrite = deferred<void>();
    const setItem = AsyncStorage.setItem as jest.Mock;
    setItem.mockImplementationOnce(() => storageWrite.promise);

    let enqueue!: Promise<string>;
    act(() => {
      enqueue = outbox.enqueueText({
        conversationId: "conversation-1",
        clientMessageId: "11111111-1111-4111-8111-111111111111",
        body: "durable hello",
      });
    });

    await act(async () => Promise.resolve());
    expect(mockSendMessage).not.toHaveBeenCalled();

    await act(async () => {
      storageWrite.resolve();
      await enqueue;
    });

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(1));
    expect(mockSendMessage.mock.calls[0][1]).toMatchObject({
      body: "durable hello",
      client_message_id: "11111111-1111-4111-8111-111111111111",
    });
    expect(mockSendMessage.mock.calls[0][2]).toMatchObject({
      headers: { Authorization: `Bearer ${jwtFor("user-A")}` },
    });
  });

  it("never sends when persistence fails", async () => {
    await renderLoaded();
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error("storage unavailable"),
    );

    await act(async () => {
      await expect(
        outbox.enqueueText({
          conversationId: "conversation-1",
          clientMessageId: "22222222-2222-4222-8222-222222222222",
          body: "keep this draft",
        }),
      ).rejects.toThrow("storage unavailable");
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(outbox.entries).toHaveLength(0);
  });

  it("aborts and purges A instead of sending A with B during token hydration", async () => {
    const token = deferred<string | null>();
    mockAuth = signedInAuth("user-A");
    mockAuth.getToken.mockImplementation(() => token.promise);
    const view = await renderLoaded();

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "shared-conversation",
        clientMessageId: "33333333-3333-4333-8333-333333333333",
        body: "owned by A",
      });
    });
    await waitFor(() => expect(mockAuth.getToken).toHaveBeenCalledTimes(1));

    mockAuth = signedInAuth("user-B");
    view.rerender(<Root client={new QueryClient()} />);
    token.resolve(jwtFor("user-A"));

    await waitFor(() => expect(outbox.hydrated).toBe(true));
    expect(mockSendMessage).not.toHaveBeenCalled();
    await waitFor(async () =>
      expect(
        await AsyncStorage.getItem(messageOutboxStorageKey("user-A")),
      ).toBeNull(),
    );
  });

  it("does not send or purge while Clerk identity is unresolved", async () => {
    mockAuth = {
      isLoaded: false,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      getToken: jest.fn(async () => null),
    };
    const removeItem = AsyncStorage.removeItem as jest.Mock;
    const getItem = AsyncStorage.getItem as jest.Mock;

    render(<Root client={new QueryClient()} />);
    await act(async () => Promise.resolve());

    expect(outbox.hydrated).toBe(false);
    expect(getItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("replays the same UUID after full unmount and removes it only on matching ACK", async () => {
    const firstTransport = deferred<never>();
    mockSendMessage.mockImplementationOnce(
      (_id: string, _body: unknown, options?: RequestInit) =>
        new Promise((_, reject) => {
          options?.signal?.addEventListener("abort", () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          );
          void firstTransport.promise;
        }),
    );
    const first = await renderLoaded();
    const clientMessageId = "44444444-4444-4444-8444-444444444444";

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "conversation-1",
        clientMessageId,
        body: "survive relaunch",
      });
    });
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(1));
    first.unmount();

    mockSendMessage.mockResolvedValueOnce({
      data: {
        id: "server-replay",
        conversation_id: "conversation-1",
        client_message_id: clientMessageId,
      },
    });
    await renderLoaded(new QueryClient());

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));
    expect(mockSendMessage.mock.calls[1][1].client_message_id).toBe(clientMessageId);
    await waitFor(() => expect(outbox.entries).toHaveLength(0));
  });

  it("keeps the record terminal when the server ACK carries another UUID", async () => {
    mockSendMessage.mockResolvedValueOnce({
      data: {
        id: "wrong-server-message",
        conversation_id: "conversation-1",
        client_message_id: "55555555-5555-4555-8555-555555555555",
      },
    });
    await renderLoaded();

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "conversation-1",
        clientMessageId: "66666666-6666-4666-8666-666666666666",
        body: "do not drop me",
      });
    });

    await waitFor(() => expect(outbox.entries[0]?.state).toBe("failed"));
    expect(outbox.entries[0]?.clientMessageId).toBe(
      "66666666-6666-4666-8666-666666666666",
    );
  });

  it("blocks a failed conversation lane while another conversation can progress", async () => {
    const firstId = "77777777-7777-4777-8777-777777777777";
    const secondId = "88888888-8888-4888-8888-888888888888";
    const otherId = "99999999-9999-4999-8999-999999999999";
    mockSendMessage.mockImplementation(
      async (conversationId: string, body: { client_message_id: string }) => {
        if (body.client_message_id === firstId) {
          throw Object.assign(new Error("invalid message"), { status: 400 });
        }
        return {
          data: {
            id: `server-${body.client_message_id}`,
            conversation_id: conversationId,
            client_message_id: body.client_message_id,
          },
        };
      },
    );
    await renderLoaded();

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "blocked-conversation",
        clientMessageId: firstId,
        body: "terminal first",
      });
    });
    await waitFor(() => expect(outbox.entries[0]?.state).toBe("failed"));

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "blocked-conversation",
        clientMessageId: secondId,
        body: "must remain behind first",
      });
      await outbox.enqueueText({
        conversationId: "independent-conversation",
        clientMessageId: otherId,
        body: "may progress independently",
      });
    });

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));
    expect(mockSendMessage.mock.calls.map((call) => call[1].client_message_id)).toEqual([
      firstId,
      otherId,
    ]);

    await act(async () => {
      await outbox.discard(firstId);
    });
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(3));
    expect(mockSendMessage.mock.calls[2][1].client_message_id).toBe(secondId);
    await waitFor(() => expect(outbox.entries).toHaveLength(0));
  });

  it("aborts and purges the active owner before explicit sign-out", async () => {
    let transportSignal: AbortSignal | undefined;
    const lateTransport = deferred<{
      data: {
        id: string;
        conversation_id: string;
        client_message_id: string;
      };
    }>();
    mockSendMessage.mockImplementationOnce(
      (_id: string, _body: unknown, options?: RequestInit) =>
        new Promise((resolve, reject) => {
          transportSignal = options?.signal ?? undefined;
          // Deliberately ignore AbortSignal: the provider's completion barrier
          // must still settle and fence this late result.
          void reject;
          lateTransport.promise.then(resolve);
        }),
    );
    await renderLoaded();

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "conversation-logout",
        clientMessageId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        body: "purge before logout",
      });
    });
    await waitFor(() => expect(transportSignal).toBeDefined());

    await act(async () => {
      await outbox.prepareForSignOut();
    });

    expect(transportSignal?.aborted).toBe(true);
    expect(outbox.entries).toHaveLength(0);
    expect(
      await AsyncStorage.getItem(messageOutboxStorageKey("user-A")),
    ).toBeNull();

    await act(async () => {
      lateTransport.resolve({
        data: {
          id: "late-after-logout",
          conversation_id: "conversation-logout",
          client_message_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        },
      });
      await lateTransport.promise;
    });
    expect(outbox.entries).toHaveLength(0);
  });

  it("keeps the singleton processor live under a StrictMode wrapper", async () => {
    render(
      <React.StrictMode>
        <Root client={new QueryClient()} />
      </React.StrictMode>,
    );
    await waitFor(() => expect(outbox.hydrated).toBe(true));

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "conversation-strict",
        clientMessageId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        body: "strict mode still drains",
      });
    });

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(outbox.entries).toHaveLength(0));
  });

  it("fences a late A acknowledgement from B's shared query cache", async () => {
    const lateTransport = deferred<{
      data: {
        id: string;
        conversation_id: string;
        client_message_id: string;
      };
    }>();
    mockSendMessage.mockImplementationOnce(() => lateTransport.promise);
    const client = new QueryClient();
    const cacheKey = ["/api/v1/conversations/shared/messages"];
    client.setQueryData(cacheKey, { data: [], error: null, meta: { total: 0 } });
    const view = await renderLoaded(client);

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "shared",
        clientMessageId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        body: "A-only acknowledgement",
      });
    });
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(1));

    mockAuth = signedInAuth("user-B");
    view.rerender(<Root client={client} />);
    client.clear();
    await waitFor(() => expect(outbox.hydrated).toBe(true));

    await act(async () => {
      lateTransport.resolve({
        data: {
          id: "server-A-late",
          conversation_id: "shared",
          client_message_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        },
      });
      await lateTransport.promise;
    });

    expect(client.getQueryData(cacheKey)).toBeUndefined();
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("surfaces a purge failure instead of allowing silent sign-out", async () => {
    const view = await renderLoaded();
    const key = messageOutboxStorageKey("user-A");
    await AsyncStorage.setItem(key, "private-body-must-not-be-forgotten");
    const setItem = AsyncStorage.setItem as jest.Mock;
    const removeItem = AsyncStorage.removeItem as jest.Mock;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      setItem.mockRejectedValueOnce(new Error("overwrite failed"));
      removeItem.mockRejectedValueOnce(new Error("remove failed"));
    }

    await act(async () => {
      await expect(outbox.prepareForSignOut()).rejects.toThrow("remove failed");
    });

    expect(await AsyncStorage.getItem(key)).toBe(
      "private-body-must-not-be-forgotten",
    );
    act(() => outbox.resumeAfterSignOutFailure());
    await act(async () => {
      await outbox.enqueueText({
        conversationId: "conversation-after-purge-failure",
        clientMessageId: "abababab-abab-4bab-8bab-abababababab",
        body: "processor resumed",
      });
    });
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(1));
    view.unmount();
  });

  it("sanitizes the value even when key removal fails", async () => {
    await renderLoaded();
    const key = messageOutboxStorageKey("user-A");
    await AsyncStorage.setItem(key, "private body");
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
      new Error("remove unavailable"),
    );

    await act(async () => {
      await outbox.prepareForSignOut();
    });

    const raw = await AsyncStorage.getItem(key);
    expect(raw).not.toContain("private body");
    expect(JSON.parse(raw ?? "{}")).toMatchObject({
      v: 1,
      ownerUserId: "user-A",
      entries: [],
    });
  });

  it("retries orphan cleanup on a loaded signed-out cold start", async () => {
    const key = messageOutboxStorageKey("orphan-user");
    await AsyncStorage.setItem(key, "orphan private body");
    mockAuth = {
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      getToken: jest.fn(async () => null),
    };

    render(<Root client={new QueryClient()} />);

    await waitFor(async () => expect(await AsyncStorage.getItem(key)).toBeNull());
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("retries persistent ACK cleanup locally without replaying the POST", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const acknowledgement = deferred<{
      data: {
        id: string;
        conversation_id: string;
        client_message_id: string;
      };
    }>();
    mockSendMessage.mockImplementationOnce(() => acknowledgement.promise);
    const view = await renderLoaded();

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "conversation-storage",
        clientMessageId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        body: "same UUID must stay retryable",
      });
    });
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(1));

    const setItem = AsyncStorage.setItem as jest.Mock;
    const removeItem = AsyncStorage.removeItem as jest.Mock;
    const setItemImplementation = setItem.getMockImplementation();
    const removeItemImplementation = removeItem.getMockImplementation();
    setItem.mockRejectedValue(new Error("local overwrite failed"));
    removeItem.mockRejectedValue(new Error("local removal failed"));

    await act(async () => {
      acknowledgement.resolve({
        data: {
          id: "server-storage",
          conversation_id: "conversation-storage",
          client_message_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        },
      });
      await acknowledgement.promise;
    });

    await waitFor(() => expect(outbox.entries[0]?.state).toBe("retrying"));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 2_200)));
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(outbox.entries[0]?.clientMessageId).toBe(
      "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    );
    setItem.mockImplementation(setItemImplementation!);
    removeItem.mockImplementation(removeItemImplementation!);
    warn.mockRestore();
    view.unmount();
  });

  it("preserves serialized FIFO when UUID order disagrees within one millisecond", () => {
    const now = 10_000;
    const first = createMessageTextOutboxEntry({
      ownerUserId: "user-A",
      conversationId: "conversation-fifo",
      clientMessageId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      body: "first tap",
      now,
    });
    const second = createMessageTextOutboxEntry({
      ownerUserId: "user-A",
      conversationId: "conversation-fifo",
      clientMessageId: "00000000-0000-4000-8000-000000000000",
      body: "second tap",
      now,
    });

    const restored = parseMessageTextOutbox(
      serializeMessageTextOutbox("user-A", [first, second], now),
      "user-A",
      now,
    );

    expect(restored.map((entry) => entry.body)).toEqual(["first tap", "second tap"]);
  });

  it("re-reads AppState after subscription and does not drain a missed background", async () => {
    const addEventListener = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, _listener) => {
        Object.defineProperty(AppState, "currentState", {
          configurable: true,
          value: "background",
        });
        return { remove: jest.fn() } as never;
      });
    const view = await renderLoaded();

    await act(async () => {
      await outbox.enqueueText({
        conversationId: "conversation-background",
        clientMessageId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        body: "wait for foreground",
      });
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(outbox.entries).toHaveLength(1);
    view.unmount();
    addEventListener.mockRestore();
  });
});
