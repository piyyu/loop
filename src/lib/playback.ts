"use client";

import { usePlayerStore } from "@/stores/player-store";
import { useRoomStore } from "@/stores/room-store";
import { songToQueued } from "@/types/room";
import type { Song } from "@/types/music";

/**
 * User-initiated playback entry point.
 * Solo: drives the local queue. In a listen-together room:
 * shares the chosen song (plus upcoming tracks) with everyone.
 */
export function startPlayback(songs: Song[], index: number): void {
  const room = useRoomStore.getState();
  const chosen = songs[index];
  if (!chosen) return;

  if (room.room && room.state) {
    void room.sendAction({
      type: "play-now",
      song: songToQueued(chosen, room.identityRef.name),
      queueAfter: songs
        .slice(index + 1)
        .map((s) => songToQueued(s, room.identityRef.name)),
    });
    return;
  }

  usePlayerStore.getState().setQueue(songs, index);
}
