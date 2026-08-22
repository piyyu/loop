import type { Song } from "./music";

/**
 * Listen Together — shared playback types.
 * The Room.state JSONB column holds a SharedPlaybackState.
 */

export interface QueuedSong {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  albumArt?: string | null;
  duration: number; // milliseconds
  streamUrl?: string;
  addedBy?: string; // display name of the member who added it
}

export interface SharedPlaybackState {
  current: QueuedSong | null;
  isPlaying: boolean;
  /** Server-clock epoch ms when the current playing segment began */
  startedAt: number | null;
  /** Position (ms) the track was paused at */
  pausedPositionMs: number | null;
  queue: QueuedSong[];
  rev: number;
}

export interface RoomInfo {
  code: string;
  hostMemberId: string;
}

export interface RoomMemberInfo {
  memberId: string;
  name: string | null;
}

export interface RoomSnapshot {
  room: RoomInfo;
  members: RoomMemberInfo[];
  state: SharedPlaybackState;
}

/** Position in the current song (ms) at a given server time */
export function positionAt(state: SharedPlaybackState, nowMs: number): number {
  if (!state.current) return 0;
  if (!state.isPlaying || state.startedAt == null) {
    return state.pausedPositionMs ?? 0;
  }
  return Math.max(0, nowMs - state.startedAt);
}

/** Build a fresh empty state */
export function emptyRoomState(): SharedPlaybackState {
  return {
    current: null,
    isPlaying: false,
    startedAt: null,
    pausedPositionMs: null,
    queue: [],
    rev: 0,
  };
}

/** Convert a provider/library Song into the wire shape */
export function songToQueued(song: Song, addedBy?: string): QueuedSong {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    albumArt: song.albumArt,
    duration: song.duration,
    streamUrl: song.streamUrl,
    addedBy,
  };
}
