import { Redirect } from "expo-router";

/**
 * `/sign-up` — the account-creation entry point.
 *
 * Registration lives inside the Profile tab as a mode, not as a screen of its
 * own, so until now there was no address for it: nothing could link to
 * "create an account", an email-verification return had nowhere to land, and
 * the web surfaces had no matching path.
 *
 * This gives it one. It resolves to the same screen that already owns the
 * flow — complete with password rules, email verification, MFA and SSO —
 * opened on the signup tab rather than the sign-in default.
 *
 * A redirect rather than a second copy of the form: duplicating a 900-line
 * auth flow to satisfy routing would put the app's most critical journey at
 * risk of drifting into two versions that slowly disagree.
 */
export default function SignUpRoute() {
  return (
    <Redirect href={{ pathname: "/(tabs)/profile", params: { authMode: "signup" } }} />
  );
}
