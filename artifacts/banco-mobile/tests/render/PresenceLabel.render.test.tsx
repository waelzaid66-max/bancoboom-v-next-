/**
 * PresenceLabel — the half of the presence feature the render layer had not
 * reached yet.
 *
 * `PresenceDot.render.test.tsx` covers the dot, and it stops there for a good
 * reason: the dot needs no providers. The label calls `useI18n`, which throws
 * outside `LanguageProvider`, so testing it means mounting the real provider.
 * That is worth the extra setup, because the label carries a failure mode the
 * dot does not have.
 *
 * WHAT ONLY A RENDER TEST CAN CATCH HERE
 *
 * `t()` returns the key itself when a string is missing:
 *
 *     if (typeof str !== "string") return key;      // LanguageContext
 *
 * So if `chat.presence.online` were ever dropped from the tree, the chat header
 * would display the literal text "chat.presence.online" to the user, in
 * production, next to the person's name. Nothing would throw. The static guard
 * checks that both keys appear at least twice in i18n.ts — which is true of a
 * comment, a different tree, or a stale duplicate. It cannot check that the
 * lookup RESOLVES. Mounting it does.
 *
 * The second thing is Arabic. The owner's stated priority for the messenger is
 * international negotiation, and the label is one of the few strings in a chat
 * that the app writes rather than the user. If it silently fell back to English
 * for an Arabic user, every static test would still pass.
 *
 *   pnpm --filter @workspace/banco-mobile run test:render
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { PresenceLabel, type Presence } from "@/components/PresenceDot";
import { LanguageProvider } from "@/context/LanguageContext";
import { translations } from "@/constants/i18n";

/** The provider reads the stored language before it renders any children. */
const LANG_KEY = "banco.lang";

/**
 * LanguageProvider renders `{ready ? children : null}` — nothing mounts until
 * the AsyncStorage read resolves. Every query below therefore has to await,
 * which is also the honest shape: this is how the component behaves in the app.
 */
function mount(presence: Presence | null | undefined) {
  return render(
    <LanguageProvider>
      <PresenceLabel presence={presence} />
    </LanguageProvider>,
  );
}

/** Resolves once the provider has finished its storage read. */
async function settled() {
  await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("PresenceLabel — what it says", () => {
  it("shows real words for online, not the translation key", async () => {
    mount("online");
    // The assertion is deliberately against the resolved English string rather
    // than "some text is present": a missing key renders the key, which IS text.
    expect(await screen.findByText("Online")).toBeTruthy();
    expect(screen.queryByText("chat.presence.online")).toBeNull();
  });

  it("shows real words for recently", async () => {
    mount("recently");
    expect(await screen.findByText("Active recently")).toBeTruthy();
    expect(screen.queryByText("chat.presence.recently")).toBeNull();
  });

  it("speaks Arabic when the app is in Arabic", async () => {
    // International negotiation is the reason the messenger exists. A silent
    // fallback to English here would pass every static test in the repo.
    await AsyncStorage.setItem(LANG_KEY, "ar");
    mount("online");
    expect(await screen.findByText("متاح الآن")).toBeTruthy();
    expect(screen.queryByText("Online")).toBeNull();
  });

  it("carries the testID the chat header can be asserted on", async () => {
    mount("online");
    expect(await screen.findByTestId("presence-label-online")).toBeTruthy();
  });
});

describe("PresenceLabel — what it refuses to say", () => {
  // Same privacy rule as the dot, enforced a second time in a second renderer.
  // The static guard counts two identical `if` lines; it cannot prove the two
  // components BEHAVE the same. These do.
  it.each(["away", "unknown"] as const)("draws nothing at all for %s", async (p) => {
    const { toJSON } = mount(p);
    await settled();
    expect(toJSON()).toBeNull();
  });

  it.each([[null], [undefined]])("draws nothing for %s", async (p) => {
    const { toJSON } = mount(p);
    await settled();
    expect(toJSON()).toBeNull();
  });

  it("renders away and unknown identically — the opt-out must not announce itself", async () => {
    // An account that switched presence off is reported as `unknown`. If the
    // label drew anything for `away` that it does not draw for `unknown`, the
    // absence of that word would say "this person opted out".
    const away = mount("away");
    await settled();
    const unknown = mount("unknown");
    await settled();
    expect(away.toJSON()).toEqual(unknown.toJSON());
  });

  it("never leaks a time, only a state", async () => {
    // The server exposes four words and never last_seen_at. Digits in this
    // label would mean a timestamp reached the client after all.
    for (const p of ["online", "recently"] as const) {
      const { getByTestId } = mount(p);
      await waitFor(() => expect(getByTestId(`presence-label-${p}`)).toBeTruthy());
      const text = getByTestId(`presence-label-${p}`).props.children;
      expect(String(text)).not.toMatch(/\d/);
    }
  });
});

describe("PresenceLabel — how it looks", () => {
  it("uses the live green only for online", async () => {
    // Green is the one colour outside the brand's red family the app allows,
    // and only for the state that is actually live. A green "recently" would
    // overstate what the server observed.
    mount("online");
    const online = await screen.findByTestId("presence-label-online");
    expect(online).toHaveStyle({ color: "#22C55E" });
  });

  it("does not paint recently green", async () => {
    mount("recently");
    const recently = await screen.findByTestId("presence-label-recently");
    expect(recently).not.toHaveStyle({ color: "#22C55E" });
  });

  it("stays on one line so a long state cannot push the name around", async () => {
    // It sits under the counterparty's name in the chat header, inside a fixed
    // row. Wrapping would move the title.
    mount("recently");
    const label = await screen.findByTestId("presence-label-recently");
    expect(label.props.numberOfLines).toBe(1);
  });
});

describe("the presence strings themselves", () => {
  it("has every state the label can render, in both trees", () => {
    // Reading the compiled module rather than the file text: this is the object
    // the app actually looks strings up in.
    for (const lang of ["en", "ar"] as const) {
      const presence = translations[lang]?.chat?.presence as
        | Record<string, string>
        | undefined;
      expect(presence).toBeDefined();
      for (const state of ["online", "recently"]) {
        expect(typeof presence?.[state]).toBe("string");
        expect(presence?.[state]?.length).toBeGreaterThan(0);
      }
    }
  });
});
