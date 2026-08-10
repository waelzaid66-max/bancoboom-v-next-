/**
 * Renderer proof for the navigation mirror used by stack-pushed mini-apps.
 *
 * A source guard can count five tab declarations. It cannot prove that all
 * five Pressables mount, that a press reaches Expo Router, or that unread state
 * is consumed passively rather than starting a second poller.
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { useListConversations } from "@workspace/api-client-react";

import {
  MINI_APP_NAV_HEIGHT,
  MiniAppBottomNav,
  miniAppNavClearance,
} from "@/components/MiniAppBottomNav";

const mockNavigate = jest.fn();
const mockHaptic = jest.fn();
let mockSignedIn = true;
let mockConversations = [{ unread: 60 }, { unread: 50 }];

jest.mock("@clerk/expo", () => ({
  useAuth: () => ({ isSignedIn: mockSignedIn }),
  useUser: () => ({ user: null }),
}));

jest.mock("@workspace/api-client-react", () => ({
  getListConversationsQueryKey: () => ["conversations"],
  useListConversations: jest.fn(() => ({ data: { data: mockConversations } })),
}));

jest.mock("expo-router", () => ({
  usePathname: () => "/section/car",
  useRouter: () => ({ navigate: mockNavigate }),
}));

jest.mock("expo-haptics", () => ({ selectionAsync: () => mockHaptic() }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 34 }),
}));

jest.mock("expo-blur", () => ({
  BlurView: (props: Record<string, unknown>) => {
    const ReactRuntime = jest.requireActual<typeof import("react")>("react");
    const Native = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return ReactRuntime.createElement(Native.View, props);
  },
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: (props: Record<string, unknown>) => {
    const ReactRuntime = jest.requireActual<typeof import("react")>("react");
    const Native = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return ReactRuntime.createElement(Native.View, props);
  },
}));

jest.mock("expo-image", () => ({
  Image: (props: Record<string, unknown>) => {
    const ReactRuntime = jest.requireActual<typeof import("react")>("react");
    const Native = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return ReactRuntime.createElement(Native.View, props);
  },
}));

jest.mock("@/components/icons", () => ({
  Feather: (props: Record<string, unknown>) => {
    const ReactRuntime = jest.requireActual<typeof import("react")>("react");
    const Native = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return ReactRuntime.createElement(Native.View, props);
  },
}));

jest.mock("@/components/BReactionButton", () => ({
  BGlyph: (props: Record<string, unknown>) => {
    const ReactRuntime = jest.requireActual<typeof import("react")>("react");
    const Native = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return ReactRuntime.createElement(Native.View, props);
  },
}));

jest.mock("@/components/AppText", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    AppText: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.Text, props),
  };
});

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    border: "#DDDDDD",
    primary: "#E8002D",
    primaryForeground: "#FFFFFF",
    mutedForeground: "#666666",
  }),
}));

const mockUseListConversations = useListConversations as jest.Mock;

describe("MiniAppBottomNav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignedIn = true;
    mockConversations = [{ unread: 60 }, { unread: 50 }];
  });

  it("mounts all five stable escape routes", () => {
    const view = render(<MiniAppBottomNav />);

    for (const key of ["index", "search", "messages", "saved", "profile"]) {
      expect(view.getByTestId(`miniapp-tab-${key}`)).toBeTruthy();
    }
  });

  it("routes a press back into the owning app tab", () => {
    const view = render(<MiniAppBottomNav />);

    fireEvent.press(view.getByTestId("miniapp-tab-messages"));

    expect(mockNavigate).toHaveBeenCalledWith("/messages");
    expect(mockHaptic).toHaveBeenCalledTimes(1);
  });

  it("caps the shared unread total and does not create a second poller", () => {
    const view = render(<MiniAppBottomNav />);

    expect(view.getByText("99+")).toBeTruthy();
    expect(mockUseListConversations).toHaveBeenCalledWith({
      query: {
        queryKey: ["conversations"],
        enabled: true,
      },
    });
    expect(
      mockUseListConversations.mock.calls[0][0].query.refetchInterval,
    ).toBeUndefined();
  });

  it("disables the cache reader while signed out", () => {
    mockSignedIn = false;
    render(<MiniAppBottomNav />);

    expect(mockUseListConversations.mock.calls[0][0].query.enabled).toBe(false);
  });

  it("publishes one clearance formula for the bar and the content below it", () => {
    expect(MINI_APP_NAV_HEIGHT).toBe(65);
    expect(miniAppNavClearance(34)).toBe(107);
  });
});
