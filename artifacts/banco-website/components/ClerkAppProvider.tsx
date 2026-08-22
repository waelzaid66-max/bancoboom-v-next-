"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import {
  setAuthFailureHandler,
  setAuthTokenGetter,
} from "@workspace/api-client-react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { bancoBrand } from "@workspace/design-tokens";
import {
  getClerkProxyUrl,
  getClerkPublishableKey,
  isClerkConfigured,
  signInPath,
  signUpPath,
  workspacePath,
} from "../lib/clerk-config";
import { localeFromPathname } from "../lib/hub-config";

const clerkAppearance = {
  theme: shadcn,
  variables: {
    colorPrimary: bancoBrand.red,
    colorBackground: "#0A0A0A",
    colorForeground: "#FFFFFF",
    colorMutedForeground: "#888888",
    colorInput: "#111111",
    colorInputForeground: "#FFFFFF",
    borderRadius: "8px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[#0A0A0A] border border-white/10 rounded-xl w-[440px] max-w-full overflow-hidden",
    formButtonPrimary: "bg-[#E8002D] hover:bg-[#CC0028] text-white",
    footerActionLink: "text-[#E8002D]",
  },
};

function AuthTokenBridgeInner() {
  const { getToken, isLoaded, signOut } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    setAuthTokenGetter(async () => {
      try {
        return (await getToken()) ?? null;
      } catch {
        return null;
      }
    });

    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded]);

  useEffect(() => {
    // Soft-deleted accounts reject with 401 ACCOUNT_DELETED while Clerk JWT
    // may still exist — clear the local session once so the user is not stuck.
    // Mirrors artifacts/banco-mobile/app/_layout.tsx AuthTokenBridge.
    setAuthFailureHandler(({ code }) => {
      if (code !== "ACCOUNT_DELETED") return;
      return signOut();
    });
    return () => setAuthFailureHandler(null);
  }, [signOut]);

  return null;
}

type ClerkAppProviderProps = {
  children: ReactNode;
};

function ClerkAppProviderConfigured({ children }: ClerkAppProviderProps) {
  const pathname = usePathname() ?? "/";
  const locale = localeFromPathname(pathname);
  const publishableKey = getClerkPublishableKey()!;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      proxyUrl={getClerkProxyUrl()}
      appearance={clerkAppearance}
      signInUrl={signInPath(locale)}
      signUpUrl={signUpPath(locale)}
      signInFallbackRedirectUrl={workspacePath(locale)}
    >
      <AuthTokenBridgeInner />
      {children}
    </ClerkProvider>
  );
}

/** W4 — Clerk web session; no-op when publishable key is absent (CI / static hubs). */
export function ClerkAppProvider({ children }: ClerkAppProviderProps) {
  if (!isClerkConfigured()) {
    return children;
  }

  if (!getClerkPublishableKey()) return children;

  return <ClerkAppProviderConfigured>{children}</ClerkAppProviderConfigured>;
}
