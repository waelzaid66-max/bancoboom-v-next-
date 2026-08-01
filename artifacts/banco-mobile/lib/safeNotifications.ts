/**
 * Safe notification surface for Expo Go SDK 53+.
 *
 * Loading `expo-notifications` on Android Expo Go logs a hard ERROR (remote
 * push removed from Expo Go). Call sites that only need badge/no-op must use
 * this helper so the Feed does not static-import the module on StoreClient.
 */
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export const isExpoGoClient =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function setAppIconBadgeCount(count: number): Promise<void> {
  if (isExpoGoClient) return;
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Unsupported platform / permission — badge is best-effort.
  }
}
