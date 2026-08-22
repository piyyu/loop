"use client";

import { create } from "zustand";
import {
  ClockSync,
  forgetRoom,
  getMemberIdentity,
  rememberRoom,
  type MemberIdentity,
} from "@/lib/room-client";
import {
  positionAt,
  type QueuedSong,
  type RoomSnapshot,
  type SharedPlaybackState,
} from "@/types/room";

export type RoomControlAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle" }
  | { type: "seek"; positionMs: number }
  | { type: "skip" }
  | { type: "play-now"; song: QueuedSong; queueAfter?: QueuedSong[] }
  | { type: "add-to-queue"; song: QueuedSong }
  | { type: "remove-from-queue"; index: number };

interface RoomMemberInfo {
  memberId: string;
  name: string | null;
}

interface RoomStore {
  room: { code: string; hostMemberId: string } | null;
  members: RoomMemberInfo[];
  state: SharedPlaybackState | null;
  clockOffsetMs: number;
  connected: boolean;
  joining: boolean;
  error: string | null;

  isInRoom: () => boolean;
  serverNow: () => number;
  expectedPositionMs: () => number;
  createRoom: () => Promise<boolean>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  sendAction: (action: RoomControlAction) => Promise<void>;

  // internals
  identityRef: MemberIdentity;
  applySnapshot: (snapshot: RoomSnapshot) => void;
  connect: (code: string) => void;
  disconnect: () => void;
}

const clockSync = new ClockSync();
let eventSource: EventSource | null = null;

export const useRoomStore = create<RoomStore>((set, get) => ({
  room: null,
  members: [],
  state: null,
  clockOffsetMs: 0,
  connected: false,
  joining: false,
  error: null,

  identityRef: { memberId: "", name: "Listener" },

  isInRoom: () => get().room !== null,

  serverNow: () => Date.now() + get().clockOffsetMs,

  expectedPositionMs: () => {
    const { state } = get();
    if (!state) return 0;
    return positionAt(state, get().serverNow());
  },

  createRoom: async () => {
    const identity = get().identityRef.memberId
      ? get().identityRef
      : getMemberIdentity();
    set({ identityRef: identity, joining: true, error: null });

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostMemberId: identity.memberId,
          hostName: identity.name,
        }),
      });
      if (!res.ok) throw new Error("create failed");

      const snapshot = (await res.json()) as RoomSnapshot;
      rememberRoom(snapshot.room.code);
      get().applySnapshot(snapshot);
      get().connect(snapshot.room.code);
      set({ joining: false });
      return true;
    } catch {
      set({ joining: false, error: "Could not create room" });
      return false;
    }
  },

  joinRoom: async (code) => {
    const identity = get().identityRef.memberId
      ? get().identityRef
      : getMemberIdentity();
    set({ identityRef: identity, joining: true, error: null });

    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: identity.memberId,
          name: identity.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        set({
          joining: false,
          error:
            res.status === 404
              ? "Room not found"
              : res.status === 410
                ? "Room expired"
                : data.error || "Could not join room",
        });
        return false;
      }

      const snapshot = (await res.json()) as RoomSnapshot;
      rememberRoom(snapshot.room.code);
      get().applySnapshot(snapshot);
      get().connect(snapshot.room.code);
      set({ joining: false });
      return true;
    } catch {
      set({ joining: false, error: "Could not join room" });
      return false;
    }
  },

  leaveRoom: async () => {
    const { room, identityRef } = get();
    if (!room) return;

    fetch(`/api/rooms/${encodeURIComponent(room.code)}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: identityRef.memberId }),
    }).catch(() => {
      // best-effort
    });

    forgetRoom();
    get().disconnect();
    set({ room: null, members: [], state: null, error: null });
  },

  sendAction: async (action) => {
    const { room, state } = get();
    if (!room || !state) return;

    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(room.code)}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: get().identityRef.memberId,
          expectedRev: state.rev,
          action,
        }),
      });

      if (res.ok) {
        const { state: newState } = (await res.json()) as {
          state: SharedPlaybackState;
        };
        get().applySnapshot({
          room,
          members: get().members,
          state: newState,
        });
      } else if (res.status === 409) {
        // Someone wrote first — adopt their state; user can tap again
        const data = (await res.json()) as { state: SharedPlaybackState | null };
        if (data.state) {
          get().applySnapshot({ room, members: get().members, state: data.state });
        }
      } else if (res.status === 410 || res.status === 404) {
        get().disconnect();
        set({ room: null, members: [], state: null, error: "Room no longer exists" });
      }
    } catch {
      // transient network issue — SSE snapshot will reconcile
    }
  },

  applySnapshot: (snapshot) => {
    const currentRev = get().state?.rev ?? -1;
    if (snapshot.state.rev < currentRev) return; // stale message

    set({
      room: snapshot.room,
      members: snapshot.members,
      state: snapshot.state,
      connected: true,
    });
  },

  connect: (code) => {
    get().disconnect();

    eventSource = new EventSource(`/api/rooms/${encodeURIComponent(code)}/events`);
    eventSource.addEventListener("snapshot", (event) => {
      try {
        const snapshot = JSON.parse((event as MessageEvent).data) as RoomSnapshot;
        get().applySnapshot(snapshot);
      } catch {
        // malformed event — ignore
      }
    });
    eventSource.addEventListener("gone", () => {
      get().disconnect();
      set({ room: null, members: [], state: null, error: "Room closed" });
    });
    eventSource.onopen = () => set({ connected: true });
    eventSource.onerror = () => set({ connected: false });

    clockSync.start((offsetMs) => set({ clockOffsetMs: offsetMs }));
  },

  disconnect: () => {
    eventSource?.close();
    eventSource = null;
    clockSync.stop();
    set({ connected: false });
  },
}));
