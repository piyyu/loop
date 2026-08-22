"use client";

import { useEffect } from "react";
import { useRoomStore } from "@/stores/room-store";
import { usePlayerStore } from "@/stores/player-store";
import type { QueuedSong, SharedPlaybackState } from "@/types/room";
import type { Song } from "@/types/music";

const DRIFT_HARD_SEEK_MS = 400;
const TICK_INTERVAL_MS = 500;

function queuedToSong(q: QueuedSong): Song {
  return {
    id: q.id,
    spotifyId: "",
    title: q.title,
    artist: q.artist,
    album: q.album ?? null,
    albumArt: q.albumArt ?? null,
    duration: q.duration,
    trackNumber: null,
    streamUrl: q.streamUrl,
  };
}

/**
 * useRoomSync — the listen-together sync engine.
 *
 * Derives the expected playback position from the shared server timestamp
 * (never accumulates locally) and nudges the local player to match:
 * - song change  → load the room's queue
 * - play/pause   → follow
 * - drift >400ms → hard seek (rate-nudge is a future refinement)
 */
export function useRoomSync() {
  useEffect(() => {
    const timer = setInterval(() => {
      const room = useRoomStore.getState();
      if (!room.room || !room.state) return;

      const st: SharedPlaybackState = room.state;
      const player = usePlayerStore.getState();

      // Room is idle — silence any room-driven playback
      if (!st.current) {
        if (player.isPlaying && player.queue.every(isRoomSong)) {
          player.pause();
        }
        return;
      }

      // Load the room song (+ upcoming queue) when it differs locally
      if (player.currentSong?.id !== st.current.id) {
        const songs = [st.current, ...st.queue].map(queuedToSong);
        const wasPlaying = st.isPlaying;
        player.setQueue(songs, 0);
        if (!wasPlaying) usePlayerStore.getState().pause();
        return; // wait for load before drift checks
      }

      // Follow play/pause transitions
      if (player.isPlaying !== st.isPlaying) {
        if (st.isPlaying) player.play();
        else player.pause();
        return;
      }

      // Drift correction while playing
      if (!st.isPlaying || !player.isPlaying) return;
      if (player.isLoading || player.duration === 0) return;

      const expectedSec = room.expectedPositionMs() / 1000;
      const driftMs = (player.progress - expectedSec) * 1000;
      if (Math.abs(driftMs) > DRIFT_HARD_SEEK_MS) {
        player.requestSeek(Math.max(0, expectedSec), false);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);
}

/** Songs injected by the room carry an empty spotifyId */
function isRoomSong(song: Song): boolean {
  return song.spotifyId === "";
}
