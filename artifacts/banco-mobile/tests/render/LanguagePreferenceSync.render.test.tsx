import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";

import { LanguagePreferenceSync } from "@/context/LanguagePreferenceSync";

const mockGetToken = jest.fn<Promise<string | null>, []>();
const mockUpdateMe = jest.fn();
let mockLang: "ar" | "en" = "en";
let mockIsSignedIn = true;
let mockUserId: string | null = "user-1";

jest.mock("@clerk/expo", () => ({
  useAuth: () => ({
    getToken: mockGetToken,
    isLoaded: true,
    isSignedIn: mockIsSignedIn,
    userId: mockUserId,
  }),
}));

jest.mock("@workspace/api-client-react", () => ({
  updateMe: (...args: unknown[]) => mockUpdateMe(...args),
}));

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({ lang: mockLang, ready: true }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLang = "en";
  mockIsSignedIn = true;
  mockUserId = "user-1";
  mockGetToken.mockResolvedValue("token-1");
  mockUpdateMe.mockResolvedValue({});
});

it("sends the hydrated preference with an explicit Clerk token", async () => {
  render(<LanguagePreferenceSync />);

  await waitFor(() => expect(mockUpdateMe).toHaveBeenCalledTimes(1));
  expect(mockUpdateMe).toHaveBeenCalledWith(
    { language: "en" },
    { headers: { Authorization: "Bearer token-1" } },
  );
});

it("does not call the protected endpoint for a signed-out guest", async () => {
  mockIsSignedIn = false;
  mockUserId = null;
  render(<LanguagePreferenceSync />);

  await act(async () => {});
  expect(mockGetToken).not.toHaveBeenCalled();
  expect(mockUpdateMe).not.toHaveBeenCalled();
});

it("serializes rapid toggles so the newest language is written last", async () => {
  let resolveEnglish: ((value: object) => void) | undefined;
  mockUpdateMe
    .mockImplementationOnce(
      () =>
        new Promise<object>((resolve) => {
          resolveEnglish = resolve;
        }),
    )
    .mockResolvedValueOnce({});

  const view = render(<LanguagePreferenceSync />);
  await waitFor(() => expect(mockUpdateMe).toHaveBeenCalledTimes(1));

  mockLang = "ar";
  view.rerender(<LanguagePreferenceSync />);
  expect(mockUpdateMe).toHaveBeenCalledTimes(1);

  await act(async () => {
    resolveEnglish?.({});
  });

  await waitFor(() => expect(mockUpdateMe).toHaveBeenCalledTimes(2));
  expect(mockUpdateMe.mock.calls.map(([body]) => body)).toEqual([
    { language: "en" },
    { language: "ar" },
  ]);
});
