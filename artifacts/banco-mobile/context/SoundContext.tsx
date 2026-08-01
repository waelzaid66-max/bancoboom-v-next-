import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const SOUND_KEY = "banco.sound_enabled";
const NOTIF_KEY = "banco.notifications_enabled";

/** Per-identity prefs — prevents account A mute leaking into B (and reverse). */
function scopedPrefKey(base: string, userId: string | null | undefined): string {
  return userId ? `${base}:u:${userId}` : `${base}:guest`;
}

// Per-service UI cues. Kept short (<1s) and mapped to a moment: a light tap for
// generic interactions, an engine rev for vehicles, a key/latch for property.
export type SoundName = "engine" | "key" | "tap";

const SOURCES: Record<SoundName, number> = {
  engine: require("@/assets/sounds/engine.wav"),
  key: require("@/assets/sounds/key.wav"),
  tap: require("@/assets/sounds/tap.wav"),
};

type SoundContextValue = {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  ready: boolean;
  setSoundEnabled: (b: boolean) => void;
  setNotificationsEnabled: (b: boolean) => void;
  playSound: (name: SoundName) => void;
};

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [ready, setReady] = useState(false);

  // Players are created lazily on first use and reused (replayed via seekTo) so
  // we never reload the asset on every cue. soundEnabledRef lets the imperative
  // playSound read the latest toggle without being recreated each render.
  const playersRef = useRef<Partial<Record<SoundName, AudioPlayer>>>({});
  const soundEnabledRef = useRef(true);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Rehydrate when identity changes — never carry mute/unmute across accounts.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
    (async () => {
      try {
        const soundKey = scopedPrefKey(SOUND_KEY, userId);
        const notifKey = scopedPrefKey(NOTIF_KEY, userId);
        const [s, n] = await AsyncStorage.multiGet([soundKey, notifKey]);
        let soundVal = s[1];
        let notifVal = n[1];
        // One-shot migrate from pre-scoping global keys (same device, first open).
        if (userId && soundVal == null) {
          const legacy = await AsyncStorage.getItem(SOUND_KEY);
          if (legacy != null) {
            soundVal = legacy;
            await AsyncStorage.setItem(soundKey, legacy);
          }
        }
        if (userId && notifVal == null) {
          const legacy = await AsyncStorage.getItem(NOTIF_KEY);
          if (legacy != null) {
            notifVal = legacy;
            await AsyncStorage.setItem(notifKey, legacy);
          }
        }
        if (cancelled) return;
        setSoundEnabledState(soundVal == null ? true : soundVal === "1");
        setNotificationsEnabledState(notifVal == null ? true : notifVal === "1");
      } catch {
        // ignore — fall back to enabled defaults
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const players = playersRef.current;
    return () => {
      Object.values(players).forEach((p) => {
        try {
          p?.remove();
        } catch {
          // ignore teardown errors
        }
      });
    };
  }, []);

  const value = useMemo<SoundContextValue>(() => {
    const setSoundEnabled = (b: boolean) => {
      setSoundEnabledState(b);
      AsyncStorage.setItem(
        scopedPrefKey(SOUND_KEY, userIdRef.current),
        b ? "1" : "0",
      ).catch(() => {});
    };
    const setNotificationsEnabled = (b: boolean) => {
      setNotificationsEnabledState(b);
      AsyncStorage.setItem(
        scopedPrefKey(NOTIF_KEY, userIdRef.current),
        b ? "1" : "0",
      ).catch(() => {});
    };
    const playSound = (name: SoundName) => {
      if (!soundEnabledRef.current) return;
      try {
        let player = playersRef.current[name];
        if (!player) {
          player = createAudioPlayer(SOURCES[name]);
          playersRef.current[name] = player;
        }
        player.seekTo(0);
        player.play();
      } catch {
        // Best-effort: audio is non-critical feedback.
      }
    };
    return {
      soundEnabled,
      notificationsEnabled,
      ready,
      setSoundEnabled,
      setNotificationsEnabled,
      playSound,
    };
  }, [soundEnabled, notificationsEnabled, ready]);

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

// Safe outside a provider — returns no-op players so a stray consumer can't crash.
export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      soundEnabled: true,
      notificationsEnabled: true,
      ready: true,
      setSoundEnabled: () => {},
      setNotificationsEnabled: () => {},
      playSound: () => {},
    };
  }
  return ctx;
}
