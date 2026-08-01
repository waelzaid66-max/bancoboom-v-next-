"use client";

import { ClerkAuthPage } from "../../../../components/ClerkAuthPage";

export default function EnSignUpPage() {
  return (
    <ClerkAuthPage locale="en" mode="sign-up" path="/en/sign-up" crossPath="/en/sign-in" />
  );
}
