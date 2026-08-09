import { Feather } from "@/components/icons";
import { Image } from "expo-image";
import { VideoPlayer, VideoView, useVideoPlayer } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MediaItem } from "@workspace/api-client-react";
import { authenticatedMediaSource } from "@/lib/mediaPolicy";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const IGNORE_ZOOM_CHANGE = () => {};

/**
 * A single pinch / double-tap / pan zoomable image slide. Each slide owns its
 * own animated transform and reports its zoom state up so the parent pager can
 * disable horizontal paging while the user is zoomed in (so a pan drags the
 * image instead of swiping to the next one) — the FB/IG/TikTok behaviour.
 */
function ZoomableImage({
  uri,
  requestHeaders,
  onZoomChange,
}: {
  uri: string;
  requestHeaders?: Record<string, string>;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  // Pan is only enabled while zoomed in. At scale 1 it stays disabled so a
  // single-finger horizontal drag is handled by the parent paging FlatList
  // (swipe to next image) instead of being swallowed by this child gesture.
  const [panEnabled, setPanEnabled] = useState(false);

  const applyZoom = (z: boolean) => {
    setPanEnabled(z);
    onZoomChange(z);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      "worklet";
      scale.value = Math.min(
        Math.max(savedScale.value * e.scale, 1),
        MAX_SCALE,
      );
    })
    .onEnd(() => {
      "worklet";
      savedScale.value = scale.value;
      if (scale.value <= 1.01) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedTx.value = 0;
        savedTy.value = 0;
        runOnJS(applyZoom)(false);
      } else {
        runOnJS(applyZoom)(true);
      }
    });

  const pan = Gesture.Pan()
    .enabled(panEnabled)
    .averageTouches(true)
    .onUpdate((e) => {
      "worklet";
      if (scale.value <= 1) return;
      const maxX = ((scale.value - 1) * SCREEN_W) / 2;
      const maxY = ((scale.value - 1) * SCREEN_H) / 2;
      tx.value = Math.min(Math.max(savedTx.value + e.translationX, -maxX), maxX);
      ty.value = Math.min(Math.max(savedTy.value + e.translationY, -maxY), maxY);
    })
    .onEnd(() => {
      "worklet";
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(220)
    .onEnd(() => {
      "worklet";
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedTx.value = 0;
        savedTy.value = 0;
        runOnJS(applyZoom)(false);
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
        runOnJS(applyZoom)(true);
      }
    });

  const gesture = Gesture.Race(
    doubleTap,
    Gesture.Simultaneous(pinch, pan),
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.slide}>
        <Animated.View style={[styles.fill, animStyle]}>
          <Image
            source={authenticatedMediaSource(uri, requestHeaders)}
            style={styles.fill}
            contentFit="contain"
            transition={120}
            cachePolicy="memory-disk"
            recyclingKey={uri}
            enforceEarlyResizing
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function FsVideoSlide({
  url,
  active,
  requestHeaders,
}: {
  url: string;
  active: boolean;
  requestHeaders?: Record<string, string>;
}) {
  const player = useVideoPlayer(authenticatedMediaSource(url, requestHeaders), (p: VideoPlayer) => {
    p.loop = true;
  });

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
    return () => {
      player.pause();
    };
  }, [active, player]);

  return (
    <View style={styles.slide}>
      <VideoView player={player} style={styles.fill} contentFit="contain" />
    </View>
  );
}

interface FullscreenImageViewerProps {
  media: MediaItem[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  requestHeaders?: Record<string, string>;
}

/**
 * Full-screen, swipeable media viewer opened by tapping a listing image. Images
 * support pinch-to-zoom, double-tap-to-zoom and pan (while zoomed); videos play
 * inline. Horizontal paging is disabled while an image is zoomed so the pan
 * gesture moves the image rather than changing slides.
 */
export function FullscreenImageViewer({
  media,
  initialIndex,
  visible,
  onClose,
  requestHeaders,
}: FullscreenImageViewerProps) {
  const insets = useSafeAreaInsets();
  // The parent (MediaGallery) remounts this component per open via a changing
  // `key`, so the pager state starts fresh for every open.
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const scrollRef = useRef<FlatList<MediaItem>>(null);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(i);
    setZoomed(false);
  }, []);

  const renderSlide = useCallback(
    ({ item, index: itemIndex }: { item: MediaItem; index: number }) => {
      const isActive = itemIndex === index;

      if (item.type === "video") {
        return isActive ? (
            <FsVideoSlide
              url={item.url}
              active
              requestHeaders={requestHeaders}
            />
        ) : (
          <View style={styles.slide}>
            {item.thumbnail_url ? (
              <Image
                source={authenticatedMediaSource(
                  item.thumbnail_url,
                  requestHeaders,
                )}
                style={styles.fill}
                contentFit="contain"
                cachePolicy="memory-disk"
                recyclingKey={item.id ?? item.url}
                enforceEarlyResizing
              />
            ) : (
              <Feather name="play-circle" size={58} color="#FFFFFF" />
            )}
          </View>
        );
      }

      return (
        <ZoomableImage
          uri={item.url}
          requestHeaders={requestHeaders}
          onZoomChange={isActive ? setZoomed : IGNORE_ZOOM_CHANGE}
        />
      );
    },
    [index, requestHeaders],
  );

  if (!visible || !media || media.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <FlatList
          ref={scrollRef}
          horizontal
          pagingEnabled
          data={media}
          keyExtractor={(item, itemIndex) =>
            String(item.id ?? `${item.url}-${itemIndex}`)
          }
          renderItem={renderSlide}
          getItemLayout={(_, itemIndex) => ({
            length: SCREEN_W,
            offset: SCREEN_W * itemIndex,
            index: itemIndex,
          })}
          initialScrollIndex={initialIndex}
          initialNumToRender={1}
          windowSize={3}
          maxToRenderPerBatch={2}
          removeClippedSubviews={Platform.OS === "android"}
          scrollEnabled={!zoomed && media.length > 1}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
        />

        <Pressable
          onPress={onClose}
          hitSlop={16}
          style={[styles.closeBtn, { top: insets.top + 6 }]}
        >
          <Feather name="x" size={26} color="#FFFFFF" />
        </Pressable>

        {media.length > 1 && (
          <View
            pointerEvents="none"
            style={[styles.counter, { top: insets.top + 12 }]}
          >
            <Text style={styles.counterText}>
              {index + 1} / {media.length}
            </Text>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: "center",
    justifyContent: "center",
  },
  fill: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  closeBtn: {
    position: "absolute",
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  counter: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
