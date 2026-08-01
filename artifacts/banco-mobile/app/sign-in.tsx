import { Redirect } from "expo-router";

/**
 * `/sign-in` — the sign-in entry point.
 *
 * Sibling of `/sign-up`. Sign-in was already what the Profile tab shows by
 * default, so this route changes nothing about what a signed-out visitor sees;
 * what it adds is an address. Deep links, notification taps and the web
 * surfaces can now say "go and sign in" and name the destination, instead of
 * every caller hard-coding `/(tabs)/profile` and hoping the default mode is
 * still the right one.
 *
 * Passing the mode explicitly also makes the pair symmetrical: arriving here
 * from a half-finished registration resets the form rather than inheriting it.
 */
export default function SignInRoute() {
  return (
    <Redirect href={{ pathname: "/(tabs)/profile", params: { authMode: "signin" } }} />
  );
}
