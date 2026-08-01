import { Platform } from "react-native";

/** Default radius when the user enables "Near me" (km). */
export const DEFAULT_NEAR_RADIUS_KM = 25;

/**
 * Selectable radii for the "Near me" search (km). The row is rendered ONLY while
 * near-me is enabled, so the compact filter sheet keeps its default height.
 * 5 → walking/neighbourhood, 100 → whole-governorate reach.
 */
export const NEAR_RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100] as const;

type NearCoords = { lat: number; lng: number };

/**
 * Browser Geolocation API path for Expo web (MAP-05). expo-location's web
 * path is unreliable in iframe / PWA hosts — navigator.geolocation is honest.
 */
function requestBrowserCoords(): Promise<NearCoords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}

/**
 * Requests foreground location permission and returns the device coordinates.
 * Returns null on denied permission, missing geolocation, or any runtime error.
 * Web uses the browser Geolocation API (MAP-05); native uses expo-location.
 */
export async function requestNearMeCoords(): Promise<NearCoords | null> {
  if (Platform.OS === "web") {
    return requestBrowserCoords();
  }
  try {
    const Location = await import("expo-location");
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      const req = await Location.requestForegroundPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
