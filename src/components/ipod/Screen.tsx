"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useNavigationStore } from "@/stores/navigation-store";
import { useSettingsStore } from "@/stores/settings-store";
import { HomeMenu } from "@/components/screens/HomeMenu";
import { MusicMenu } from "@/components/screens/MusicMenu";
import { PlaylistsScreen } from "@/components/screens/PlaylistsScreen";
import { PlaylistDetailScreen } from "@/components/screens/PlaylistDetailScreen";
import { SongsScreen } from "@/components/screens/SongsScreen";
import { AlbumsScreen } from "@/components/screens/AlbumsScreen";
import { ArtistsScreen } from "@/components/screens/ArtistsScreen";
import { FavoritesScreen } from "@/components/screens/FavoritesScreen";
import { DownloadsScreen } from "@/components/screens/DownloadsScreen";
import { RecentlyPlayedScreen } from "@/components/screens/RecentlyPlayedScreen";
import { SearchScreen } from "@/components/screens/SearchScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { NowPlayingScreen } from "@/components/screens/NowPlayingScreen";
import { CoverFlowScreen } from "@/components/screens/CoverFlowScreen";
import { EqualizerScreen } from "@/components/screens/EqualizerScreen";
import { StatsScreen } from "@/components/screens/StatsScreen";

import { StatusBar } from "./StatusBar";

const slideVariants = {
  enter: (direction: string) => ({
    x: direction === "left" ? "100%" : "-100%",
    opacity: 0.8,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: string) => ({
    x: direction === "left" ? "-100%" : "100%",
    opacity: 0.8,
  }),
};

/**
 * Screen component — renders the active iPod screen with
 * slide transitions between menu levels.
 */
export function Screen() {
  const { currentScreen, transitionDirection } = useNavigationStore();
  const { darkMode } = useSettingsStore();

  const screenColor = darkMode ? "#0F1410" : "#B8C9A3";

  return (
    <div
      className="relative overflow-hidden flex-1 w-full flex flex-col"
      style={{
        background: screenColor,
      }}
    >
      {/* Static retro status bar */}
      <StatusBar />

      {/* Animating screen area */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden">
        <AnimatePresence mode="popLayout" custom={transitionDirection}>
          <motion.div
            key={currentScreen.id + JSON.stringify(currentScreen.data || {})}
            custom={transitionDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: "tween",
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute inset-0 flex flex-col"
          >
            <ScreenContent screenId={currentScreen.id} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ScreenContent({ screenId }: { screenId: string }) {
  switch (screenId) {
    case "home":
      return <HomeMenu />;
    case "music":
      return <MusicMenu />;
    case "playlists":
      return <PlaylistsScreen />;
    case "playlist-detail":
      return <PlaylistDetailScreen />;
    case "songs":
      return <SongsScreen />;
    case "albums":
      return <AlbumsScreen />;
    case "artists":
      return <ArtistsScreen />;
    case "favorites":
      return <FavoritesScreen />;
    case "downloads":
      return <DownloadsScreen />;
    case "recently-played":
      return <RecentlyPlayedScreen />;
    case "search":
      return <SearchScreen />;
    case "settings":
      return <SettingsScreen />;
    case "now-playing":
      return <NowPlayingScreen />;
    case "cover-flow":
      return <CoverFlowScreen />;
    case "equalizer":
      return <EqualizerScreen />;
    case "stats":
      return <StatsScreen />;
    default:
      return <HomeMenu />;
  }
}
