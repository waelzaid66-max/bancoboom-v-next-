import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const FULL_SCREEN_WEB_CSS = `
html,
body,
#root {
  width: 100%;
  height: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  overflow: hidden;
  overscroll-behavior: none;
}

#root {
  display: flex;
  flex: 1 1 auto;
  min-height: 100vh;
  min-height: 100dvh;
}
`;

/**
 * Web-only document shell.
 *
 * Section mini-apps use flex-owned result surfaces and an absolutely positioned
 * MiniAppBottomNav. Their complete ancestor chain therefore needs a bounded
 * viewport height on web; otherwise an empty/loading route can collapse to its
 * header height and anchor the bottom capsule directly underneath the header.
 */
export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: FULL_SCREEN_WEB_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
