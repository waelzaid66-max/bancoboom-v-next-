"use client";

import { ClerkAuthPage } from "../../../components/ClerkAuthPage";

export default function SignInPage() {
  return (
    <ClerkAuthPage locale="ar" mode="sign-in" path="/sign-in" crossPath="/sign-up" />
  );
}
