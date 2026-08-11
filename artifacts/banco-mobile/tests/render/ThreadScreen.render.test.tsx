import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sendMessage, useGetMessages } from "@workspace/api-client-react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import { ThreadScreen } from "@/app/messages/[id]";
import { useMessageOutbox } from "@/context/MessageOutboxContext";

const mockEnqueueText = jest.fn();
const mockRetryOutbox = jest.fn();
const mockDiscardOutbox = jest.fn();
const mockRandomUUID = jest.fn();
const mockRefetch = jest.fn(async () => undefined);
const mockMarkConversationRead = jest.fn(async (_id: string) => undefined);

let mockMessages: Record<string, unknown>[] = [];
let mockOutboxEntries: Record<string, unknown>[] = [];

jest.mock("@workspace/api-client-react", () => ({
  useGetMessages: jest.fn(() => ({
    data: {
      data: mockMessages,
      error: null,
      meta: { total: mockMessages.length },
    },
    isLoading: false,
    isError: false,
    isFetched: true,
    refetch: mockRefetch,
  })),
  sendMessage: jest.fn(),
  getMessages: jest.fn(async () => ({ data: [] })),
  getListing: jest.fn(async () => null),
  reactToMessage: jest.fn(async () => undefined),
  markConversationRead: (id: string) => mockMarkConversationRead(id),
  updateListing: jest.fn(async () => undefined),
  createSupportTicket: jest.fn(async () => undefined),
  deleteConversation: jest.fn(async () => undefined),
  getListConversationsQueryKey: () => ["/api/v1/conversations"],
  getGetMessagesQueryKey: (id: string) => [
    `/api/v1/conversations/${id}/messages`,
  ],
  getGetListingQueryKey: (id: string) => [`/api/v1/listings/${id}`],
  getGetMyListingsQueryKey: () => ["/api/v1/listings/mine"],
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({
    id: "conversation-X",
    name: "Other person",
  }),
}));

jest.mock("expo-crypto", () => ({
  randomUUID: () => mockRandomUUID(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: {
    Error: "error",
    Success: "success",
  },
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: false })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  MediaTypeOptions: { All: "all" },
}));

jest.mock("expo-image", () => {
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return { Image: Native.View };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 12, left: 0 }),
}));

jest.mock("@/components/icons", () => {
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return { Feather: Native.View };
});

jest.mock("@/components/AppText", () => {
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return { AppText: Native.Text };
});

jest.mock("@/components/AppTextInput", () => {
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return { AppTextInput: Native.TextInput };
});

jest.mock("@/components/EmojiPicker", () => ({ EmojiPicker: () => null }));
jest.mock("@/components/FullscreenImageViewer", () => ({
  FullscreenImageViewer: () => null,
}));
jest.mock("@/components/PermissionRationaleModal", () => ({
  PermissionRationaleModal: () => null,
}));
jest.mock("@/components/PresenceDot", () => ({ PresenceLabel: () => null }));

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
    lang: "en",
  }),
}));

jest.mock("@/context/MessageOutboxContext", () => ({
  useMessageOutbox: jest.fn(() => ({
    hydrated: true,
    entries: mockOutboxEntries,
    enqueueText: mockEnqueueText,
    retry: mockRetryOutbox,
    discard: mockDiscardOutbox,
    prepareForSignOut: jest.fn(async () => undefined),
    suspendForAccountDeletion: jest.fn(),
    resumeAfterAccountDeletionFailure: jest.fn(),
    purgeAfterAccountDeletion: jest.fn(async () => undefined),
  })),
}));

jest.mock("@/context/SessionContext", () => ({
  useSession: () => ({ bumpListings: jest.fn() }),
}));

jest.mock("@/constants/quickReplies", () => ({ quickReplyKeys: () => [] }));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#fff",
    border: "#ddd",
    bubbleMine: "#126",
    card: "#f5f5f5",
    destructive: "#c00",
    foreground: "#111",
    mutedForeground: "#777",
    primary: "#126",
    primaryForeground: "#fff",
    radius: 12,
    secondary: "#eee",
  }),
}));

jest.mock("@/hooks/useAuthenticatedMedia", () => ({
  useAuthenticatedMediaHeaders: () => ({}),
}));
jest.mock("@/lib/mediaPolicy", () => ({
  authenticatedMediaSource: (uri: string) => ({ uri }),
}));
jest.mock("@/lib/upload", () => ({
  uploadMediaAsset: jest.fn(async () => ({ url: "", kind: "image" })),
  isVideoAsset: () => false,
}));
jest.mock("@/lib/listingMedia", () => ({
  MAX_VIDEO_MB: 100,
  MAX_VIDEO_SECONDS: 60,
  partitionPickedAssets: () => ({ accepted: [], rejected: [] }),
}));

const mockUseGetMessages = useGetMessages as jest.Mock;
const mockUseMessageOutbox = useMessageOutbox as jest.Mock;
const mockSendMessage = sendMessage as jest.Mock;

function renderThread() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThreadScreen />
    </QueryClientProvider>,
  );
}

function incomingMessage() {
  return {
    id: "incoming-1",
    conversation_id: "conversation-X",
    sender_id: "other-user",
    client_message_id: null,
    body: "original message",
    is_mine: false,
    created_at: new Date(0).toISOString(),
    read_at: null,
    media_url: null,
    media_kind: null,
    reactions: {},
    my_reactions: [],
    reply_to: null,
    listing_ref: null,
  };
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

describe("ThreadScreen durable text integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMessages = [];
    mockOutboxEntries = [];
    mockUseGetMessages.mockImplementation(() => ({
      data: {
        data: mockMessages,
        error: null,
        meta: { total: mockMessages.length },
      },
      isLoading: false,
      isError: false,
      isFetched: true,
      refetch: mockRefetch,
    }));
    mockUseMessageOutbox.mockImplementation(() => ({
      hydrated: true,
      entries: mockOutboxEntries,
      enqueueText: mockEnqueueText,
      retry: mockRetryOutbox,
      discard: mockDiscardOutbox,
    }));
    mockRandomUUID.mockReturnValue("11111111-1111-4111-8111-111111111111");
    mockSendMessage.mockResolvedValue({
      data: {
        id: "server-direct",
        conversation_id: "conversation-X",
        client_message_id: "11111111-1111-4111-8111-111111111111",
        body: "direct reply",
      },
    });
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps the composer draft until body-only persistence resolves", async () => {
    const persisted = deferred<string>();
    mockEnqueueText.mockReturnValueOnce(persisted.promise);
    const view = renderThread();

    fireEvent.changeText(view.getByTestId("message-input"), "keep until durable");
    fireEvent.press(view.getByTestId("message-send"));

    expect(mockEnqueueText).toHaveBeenCalledWith({
      conversationId: "conversation-X",
      clientMessageId: "11111111-1111-4111-8111-111111111111",
      body: "keep until durable",
    });
    expect(view.getByTestId("message-input").props.value).toBe(
      "keep until durable",
    );
    expect(mockSendMessage).not.toHaveBeenCalled();

    await act(async () => {
      persisted.resolve("11111111-1111-4111-8111-111111111111");
      await persisted.promise;
    });

    await waitFor(() =>
      expect(view.getByTestId("message-input").props.value).toBe(""),
    );
    view.unmount();
  });

  it("does not erase a new draft typed while the previous one persists", async () => {
    const persisted = deferred<string>();
    mockEnqueueText.mockReturnValueOnce(persisted.promise);
    const view = renderThread();

    fireEvent.changeText(view.getByTestId("message-input"), "first message");
    fireEvent.press(view.getByTestId("message-send"));
    fireEvent.changeText(view.getByTestId("message-input"), "next draft");

    await act(async () => {
      persisted.resolve("11111111-1111-4111-8111-111111111111");
      await persisted.promise;
    });

    await waitFor(() =>
      expect(view.getByTestId("message-input").props.value).toBe("next draft"),
    );
    view.unmount();
  });

  it("uses a revision rather than text equality across an A-to-B-to-A edit", async () => {
    const persisted = deferred<string>();
    mockEnqueueText.mockReturnValueOnce(persisted.promise);
    const view = renderThread();

    fireEvent.changeText(view.getByTestId("message-input"), "same words");
    fireEvent.press(view.getByTestId("message-send"));
    fireEvent.changeText(view.getByTestId("message-input"), "temporary edit");
    fireEvent.changeText(view.getByTestId("message-input"), "same words");

    await act(async () => {
      persisted.resolve("11111111-1111-4111-8111-111111111111");
      await persisted.promise;
    });

    await waitFor(() =>
      expect(view.getByTestId("message-input").props.value).toBe("same words"),
    );
    view.unmount();
  });

  it("preserves a reply selected while body-only persistence is pending", async () => {
    const persisted = deferred<string>();
    mockEnqueueText.mockReturnValueOnce(persisted.promise);
    mockMessages = [incomingMessage()];
    const view = renderThread();

    fireEvent.changeText(view.getByTestId("message-input"), "plain send");
    fireEvent.press(view.getByTestId("message-send"));
    fireEvent(view.getByTestId("message-incoming-1"), "longPress");
    fireEvent.press(view.getByTestId("action-reply"));

    await act(async () => {
      persisted.resolve("11111111-1111-4111-8111-111111111111");
      await persisted.promise;
    });

    await waitFor(() => expect(view.getByTestId("reply-cancel")).toBeTruthy());
    expect(view.getByTestId("message-input").props.value).toBe("");
    view.unmount();
  });

  it("keeps quoted replies on the existing direct transport", async () => {
    mockMessages = [incomingMessage()];
    const view = renderThread();

    fireEvent(view.getByTestId("message-incoming-1"), "longPress");
    fireEvent.press(view.getByTestId("action-reply"));
    fireEvent.changeText(view.getByTestId("message-input"), "direct reply");
    fireEvent.press(view.getByTestId("message-send"));

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(1));
    expect(mockEnqueueText).not.toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalledWith("conversation-X", {
      body: "direct reply",
      client_message_id: "11111111-1111-4111-8111-111111111111",
      reply_to_id: "incoming-1",
    });
    view.unmount();
  });

  it("renders durable rows only for the active conversation", () => {
    mockOutboxEntries = [
      {
        ownerUserId: "user-A",
        clientMessageId: "22222222-2222-4222-8222-222222222222",
        conversationId: "conversation-X",
        body: "visible durable row",
        createdAt: 1,
        attemptCount: 0,
        nextAttemptAt: 1,
        autoRetryUntil: 2,
        state: "queued",
        holdReason: null,
        lastStatus: null,
      },
      {
        ownerUserId: "user-A",
        clientMessageId: "33333333-3333-4333-8333-333333333333",
        conversationId: "conversation-Y",
        body: "foreign conversation row",
        createdAt: 1,
        attemptCount: 0,
        nextAttemptAt: 1,
        autoRetryUntil: 2,
        state: "queued",
        holdReason: null,
        lastStatus: null,
      },
    ];

    const view = renderThread();

    expect(view.getByText("visible durable row")).toBeTruthy();
    expect(view.queryByText("foreign conversation row")).toBeNull();
    view.unmount();
  });
});
