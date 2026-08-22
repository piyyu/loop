"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { useRoomStore } from "@/stores/room-store";
import { formatTime } from "@/utils/format";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";

/**
 * Inside a listen-together room: members, shared controls and the queue.
 * Every member can control playback — writes are serialized by the server.
 */
export function PartyRoomScreen() {
  const { pop } = useNavigationStore();
  const room = useRoomStore((s) => s.room);
  const members = useRoomStore((s) => s.members);
  const state = useRoomStore((s) => s.state);
  const connected = useRoomStore((s) => s.connected);
  const sendAction = useRoomStore((s) => s.sendAction);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);

  if (!room) {
    return (
      <Centered>
        Not in a room — go back and create or join one.
      </Centered>
    );
  }

  const isHost = room.hostMemberId === useRoomStore.getState().identityRef.memberId;

  const items: MenuItem[] = [
    {
      id: "code",
      label: `Code: ${room.code}`,
      subtitle: `Share this code — ${members.length} listening`,
      icon: connected ? "◉" : "◌",
    },
  ];

  // Now playing
  if (state?.current) {
    items.push({
      id: "now",
      label: state.current.title,
      subtitle: `${state.current.artist} · ${formatTime(state.current.duration)}`,
      icon: state.isPlaying ? "▶" : "❙❙",
      action: () => void sendAction({ type: "toggle" }),
    });
  }

  // Shared transport
  items.push(
    {
      id: "playpause",
      label:
        !state?.current
          ? "Nothing Playing"
          : state.isPlaying
            ? "Pause"
            : "Play",
      icon: state?.isPlaying ? "❙❙" : "▶",
      action: () => void sendAction({ type: "toggle" }),
    },
    {
      id: "skip",
      label: "Skip to Next",
      icon: "▶▶",
      action: () => void sendAction({ type: "skip" }),
    }
  );

  // Queue
  state?.queue.forEach((song, index) => {
    items.push({
      id: `q-${song.id}-${index}`,
      label: song.title,
      subtitle: `${song.artist} · added by ${song.addedBy || "member"} · ${formatTime(song.duration)}`,
      icon: "♬",
      action: () =>
        void sendAction({
          type: "play-now",
          song: song,
        }),
    });
  });

  if (state && state.queue.length === 0) {
    items.push({
      id: "queue-empty",
      label: "Queue is empty",
      subtitle: "Play songs normally to add them here",
    });
  }

  items.push(
    {
      id: "leave",
      label: "Leave Room",
      icon: "✕",
      action: async () => {
        await leaveRoom();
        pop();
      },
    },
    ...(isHost
      ? [
          {
            id: "host-note",
            label: "You are the host",
            subtitle: "Rooms expire after 72h idle",
          } as MenuItem,
        ]
      : [])
  );

  return <MenuList items={items} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center h-full px-6">
      <div
        className="text-center"
        style={{
          fontFamily: "'Chicago', 'SF Pro Text', system-ui",
          fontSize: "12px",
          color: "#5A6A4A",
        }}
      >
        {children}
      </div>
    </div>
  );
}
