"use client";

import { ClerkAuthPage } from "../../../../components/ClerkAuthPage";

export default function EnSignInPage() {
  return (
    <ClerkAuthPage locale="en" mode="sign-in" path="/en/sign-in" crossPath="/en/sign-up" />
  );
}
