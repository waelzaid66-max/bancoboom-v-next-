"use client";

import { ClerkAuthPage } from "../../../components/ClerkAuthPage";

export default function SignUpPage() {
  return (
    <ClerkAuthPage locale="ar" mode="sign-up" path="/sign-up" crossPath="/sign-in" />
  );
}
