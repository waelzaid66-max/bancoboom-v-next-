import { useAuth } from "@clerk/expo";
import { useEffect, useMemo, useState } from "react";

const TOKEN_REFRESH_MS = 45_000;

/**
 * Short-lived bearer headers for private media requests. The source builder in
 * mediaPolicy applies them only to the configured BANCO API origin, preventing
 * an attachment URL from exfiltrating a Clerk token to a third-party host.
 */
export function useAuthenticatedMediaHeaders(): Record<string, string> | undefined {
  const { getToken, isSignedIn } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (!isSignedIn) {
        if (active) setToken(null);
        return;
      }
      const next = await getToken().catch(() => null);
      if (active) setToken(next);
    };

    void refresh();
    const timer = setInterval(() => void refresh(), TOKEN_REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [getToken, isSignedIn]);

  return useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  );
}
