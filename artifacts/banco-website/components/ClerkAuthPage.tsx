"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { isClerkConfigured } from "../lib/clerk-config";

type Locale = "ar" | "en";
type Mode = "sign-in" | "sign-up";

type ClerkAuthPageProps = {
  locale: Locale;
  mode: Mode;
  path: string;
  crossPath: string;
};

const COPY = {
  ar: {
    signInTitle: "تسجيل الدخول",
    signUpTitle: "إنشاء حساب",
    unavailable:
      "تسجيل الدخول غير متاح حالياً على هذا الموقع. استخدم تطبيق BANCO أو أعد المحاولة لاحقاً.",
    home: "العودة للرئيسية",
  },
  en: {
    signInTitle: "Sign in",
    signUpTitle: "Create account",
    unavailable:
      "Sign-in is not available on this site right now. Use the BANCO app or try again later.",
    home: "Back to home",
  },
} as const;

const shellStyle = {
  maxWidth: 480,
  margin: "2.5rem auto",
  padding: "0 1.25rem",
  display: "flex",
  justifyContent: "center",
} as const;

function UnavailableNotice({ locale, mode }: { locale: Locale; mode: Mode }) {
  const copy = COPY[locale];
  const home = locale === "en" ? "/en" : "/";
  const title = mode === "sign-in" ? copy.signInTitle : copy.signUpTitle;

  return (
    <main
      style={{
        ...shellStyle,
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        textAlign: "center",
      }}
      data-banco-journey={mode}
      data-banco-clerk="unavailable"
    >
      <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>{title}</h1>
      <p style={{ margin: 0, color: "var(--banco-muted)", lineHeight: 1.7 }}>{copy.unavailable}</p>
      <a href={home} style={{ color: "var(--banco-primary)", fontWeight: 600 }}>
        {copy.home}
      </a>
    </main>
  );
}

/**
 * Clerk SignIn/SignUp must only mount inside ClerkProvider.
 * When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is absent (CI smokes, keyless previews),
 * ClerkAppProvider is a no-op — rendering <SignIn/> then 500s. Gate here.
 */
export function ClerkAuthPage({ locale, mode, path, crossPath }: ClerkAuthPageProps): ReactNode {
  if (!isClerkConfigured()) {
    return <UnavailableNotice locale={locale} mode={mode} />;
  }

  return (
    <main style={shellStyle} data-banco-journey={mode} data-banco-clerk="configured">
      {mode === "sign-in" ? (
        <SignIn routing="path" path={path} signUpUrl={crossPath} />
      ) : (
        <SignUp routing="path" path={path} signInUrl={crossPath} />
      )}
    </main>
  );
}
