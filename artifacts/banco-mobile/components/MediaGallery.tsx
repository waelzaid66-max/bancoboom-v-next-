import { Ionicons } from "@/components/icons";
import { Image } from "expo-image";
import { VideoPlayer, VideoView, useVideoPlayer } from "expo-video";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { MediaItem } from "@workspace/api-client-react";
import { FullscreenImageViewer } from "@/components/FullscreenImageViewer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface VideoSlideProps {
  url: string;
  posterUrl?: string | null;
  height: number;
  isActive: boolean;
}

function VideoSlide({ url, posterUrl, height, isActive }: VideoSlideProps) {
  const player = useVideoPlayer(url, (p: VideoPlayer) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
    return () => {
      player.pause();
    };
  }, [isActive, player]);

  // Inactive + poster: show still image (decoder stays paused). Active: video.
  if (!isActive && posterUrl) {
    return (
      <Image
        source={{ uri: posterUrl }}
        style={{ width: SCREEN_WIDTH, height }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        enforceEarlyResizing
      />
    );
  }

  return (
    <VideoView
      player={player}
      style={{ width: SCREEN_WIDTH, height }}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

interface MediaGalleryProps {
  media: MediaItem[];
  height?: number;
}

export function MediaGallery({ media, height = 300 }: MediaGalleryProps) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(idx);
  }, []);

  const openViewer = useCallback((idx: number) => {
    setViewerIndex(idx);
    setViewerOpen(true);
  }, []);

  const renderSlide = useCallback(
    ({ item, index: idx }: { item: MediaItem; index: number }) => {
      const isActive = idx === activeIndex;
      return (
        <Pressable
          onPress={() => openViewer(idx)}
          style={{ width: SCREEN_WIDTH, height }}
        >
          {item.type === "video" ? (
            isActive ? (
              <VideoSlide
                url={item.url}
                posterUrl={item.thumbnail_url}
                height={height}
                isActive
              />
            ) : item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={styles.image}
                contentFit="cover"
                transition={150}
                cachePolicy="memory-disk"
                recyclingKey={item.id ?? item.url}
                enforceEarlyResizing
              />
            ) : (
              <View style={[styles.videoPlaceholder, { height }]}>
                <Ionicons name="play-circle" size={52} color="#FFFFFF" />
              </View>
            )
          ) : (
            <Image
              source={{ uri: item.url }}
              style={styles.image}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
              recyclingKey={item.id ?? item.url}
              enforceEarlyResizing
            />
          )}
        </Pressable>
      );
    },
    [activeIndex, height, openViewer],
  );

  if (!media || media.length === 0) {
    return (
      <View
        style={[
          styles.placeholder,
          { height, backgroundColor: colors.muted },
        ]}
      >
        <Ionicons name="image-outline" size={48} color={colors.mutedForeground} />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { height }]}>
      <FlatList
        horizontal
        pagingEnabled
        data={media}
        keyExtractor={(item, idx) => String(item.id ?? `${item.url}-${idx}`)}
        renderItem={renderSlide}
        getItemLayout={(_, idx) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * idx,
          index: idx,
        })}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEnabled={media.length > 1}
        style={{ width: SCREEN_WIDTH }}
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews={Platform.OS === "android"}
      />

      {media.length > 1 && (
        <View style={styles.dots}>
          {media.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === activeIndex ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                  width: idx === activeIndex ? 16 : 6,
                },
              ]}
            />
          ))}
        </View>
      )}

      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {activeIndex + 1} / {media.length}
        </Text>
      </View>

      <FullscreenImageViewer
        key={viewerOpen ? `viewer-${viewerIndex}` : "viewer-closed"}
        media={media}
        initialIndex={viewerIndex}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  counter: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
