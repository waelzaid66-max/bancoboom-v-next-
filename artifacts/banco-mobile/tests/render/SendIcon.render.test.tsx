/**
 * The send icon — a render test, because this defect was invisible to every
 * static one.
 *
 * WHAT WAS ACTUALLY WRONG
 *
 * The owner reported the send icon reading as a "V". The source looked fine:
 * `<Feather name="send" />`, the same line it had always been. Nothing a regex
 * could object to, and `icons.test.mjs` — which checks that every name used is
 * mapped in the registry — passed, because `send` IS mapped.
 *
 * The problem was one level below the name. This app does not ship the Feather
 * font any more; `components/icons.tsx` re-exports a registry that renders
 * lucide SVGs under the old names. Lucide's `send` is an outlined paper plane
 * whose left edge is a long shallow V, and at 18px with a 2px stroke the
 * interior all but closes, leaving the V. In Arabic the button mirrors it, so
 * it lands between a checkmark and an arrow.
 *
 * So the bug lived entirely in what got PAINTED. A test that reads source text
 * cannot see a fill attribute resolve, which is exactly why this one mounts the
 * icon and inspects the tree it produces.
 *
 *   pnpm --filter @workspace/banco-mobile run test:render
 */
import React from "react";
import { render } from "@testing-library/react-native";

import { Feather } from "@/components/icons";

/** Pulls every `fill` in the rendered tree, root included. */
function fills(node: unknown): string[] {
  const out: string[] = [];
  const walk = (n: any) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.props && typeof n.props.fill === "string") out.push(n.props.fill);
    if (n.children) walk(n.children);
  };
  walk(node);
  return out;
}

const RED = "#E8002D";

describe("the send icon", () => {
  it("is painted, not left as a hollow outline", () => {
    // The whole defect in one assertion: an unfilled lucide `send` is the V.
    const tree = render(<Feather name="send" size={18} color={RED} />).toJSON();
    expect(fills(tree)).toContain(RED);
  });

  it("does not fall back to the unmapped-icon placeholder", () => {
    // If `send` ever leaves the registry the app quietly renders CircleAlert —
    // a warning triangle where the send button should be. Nothing would fail.
    const tree = render(<Feather name="send" size={18} color={RED} />).toJSON();
    expect(tree).not.toBeNull();
    expect(JSON.stringify(tree)).not.toMatch(/circle-alert/i);
  });

  it("leaves ordinary outline icons hollow", () => {
    // Filling is deliberate and narrow. If it ever became the default, every
    // outline glyph in the app would turn into a solid blob.
    const tree = render(<Feather name="search" size={18} color={RED} />).toJSON();
    expect(fills(tree).every((f) => f === "none")).toBe(true);
  });

  it("still fills the icons that were already filled", () => {
    // heart and star predate this change and the saved/rated states depend on
    // the filled-vs-outline distinction.
    for (const name of ["heart", "star"] as const) {
      const tree = render(<Feather name={name} size={18} color={RED} />).toJSON();
      expect(fills(tree)).toContain(RED);
    }
  });

  it("takes the colour it is handed, so it can invert on the red button", () => {
    // The send button paints the icon in primaryForeground on red when the
    // draft has text, and in mutedForeground when it is empty. A hardcoded
    // colour would make the enabled state invisible.
    const white = render(<Feather name="send" size={18} color="#FFFFFF" />).toJSON();
    expect(fills(white)).toContain("#FFFFFF");
    expect(fills(white)).not.toContain(RED);
  });
});
