import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sendMessage } from "@workspace/api-client-react";
import { act, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { AppState, Text } from "react-native";

import {
  MessageOutboxProvider,
  messageOutboxStorageKey,
  useMessageOutbox,
} from "@/context/MessageOutboxContext";

type MockAuth = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  getToken: jest.Mock<Promise<string | null>, []>;
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function jwtFor(userId: string): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "none" })}.${encode({ sub: userId })}.test-signature`;
}

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

type OutboxApi = ReturnType<typeof useMessageOutbox>;
let outbox!: OutboxApi;

function Harness() {
  outbox = useMessageOutbox();
  return <Text testID="outbox-count">{String(outbox.entries.length)}</Text>;
}

function Root() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MessageOutboxProvider>
        <Harness />
      </MessageOutboxProvider>
    </QueryClientProvider>
  );
}

describe("MessageOutboxProvider terminal account-deletion race", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(AppState, "currentState", {
      configurable: true,
      value: "active",
    });
    mockAuth = {
      isLoaded: true,
      isSignedIn: true,
      userId: "user-A",
      sessionId: "session-user-A",
      getToken: jest.fn(async () => jwtFor("user-A")),
    };
    mockUseAuth.mockImplementation(() => mockAuth);
    mockSendMessage.mockResolvedValue({
      data: {
        id: "unused-server-id",
        conversation_id: "unused-conversation",
        client_message_id: "unused-client-id",
      },
    });
  });

  it("RED: once terminal purge starts, a concurrent enqueue is rejected and cannot recreate durable state", async () => {
    render(<Root />);
    await waitFor(() => expect(outbox.hydrated).toBe(true));

    const removeGate = deferred<void>();
    const removeItem = AsyncStorage.removeItem as jest.Mock;
    removeItem.mockImplementationOnce(() => removeGate.promise);

    let purgePromise!: Promise<void>;
    act(() => {
      purgePromise = outbox.purgeAfterAccountDeletion();
    });

    await waitFor(() => expect(removeItem).toHaveBeenCalledTimes(1));

    const enqueuePromise = outbox.enqueueText({
      conversationId: "conversation-delete-race",
      clientMessageId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      body: "must never survive confirmed account deletion",
    });

    await act(async () => {
      removeGate.resolve(undefined);
      await purgePromise;
    });

    await expect(enqueuePromise).rejects.toThrow();
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(outbox.hydrated).toBe(false);
    expect(outbox.entries).toHaveLength(0);
    expect(
      await AsyncStorage.getItem(messageOutboxStorageKey("user-A")),
    ).toBeNull();
  });
});
