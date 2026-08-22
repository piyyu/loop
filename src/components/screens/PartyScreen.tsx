"use client";

import { useState } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { useRoomStore } from "@/stores/room-store";
import { getRememberedRoom, setMemberName } from "@/lib/room-client";
import { MenuList } from "@/components/ipod/MenuList";
import { unlockAudio } from "@/lib/audio-registry";
import type { MenuItem } from "@/types/navigation";

/**
 * Listen Together entry screen — rejoin the last room, create or join one.
 */
export function PartyScreen() {
  const { push, pop } = useNavigationStore();
  const room = useRoomStore((s) => s.room);
  const joining = useRoomStore((s) => s.joining);
  const error = useRoomStore((s) => s.error);
  const createRoom = useRoomStore((s) => s.createRoom);
  const joinRoom = useRoomStore((s) => s.joinRoom);
  const [busy, setBusy] = useState(false);

  const rememberedCode = typeof window !== "undefined" ? getRememberedRoom() : null;
  const activeCode = room?.code ?? null;

  const openRoom = () => {
    useNavigationStore.getState().goHome(); // reset selection state
    push({ id: "party-room", title: activeCode ?? "Party" });
  };

  const handleCreate = async () => {
    setBusy(true);
    unlockAudio();
    if (await createRoom()) {
      openRoom();
    }
    setBusy(false);
  };

  const handleRejoin = async (code: string) => {
    setBusy(true);
    unlockAudio();
    if (await joinRoom(code)) {
      openRoom();
    }
    setBusy(false);
  };

  const items: MenuItem[] = [];

  // Already connected to a room — jump back in
  if (activeCode) {
    items.push({
      id: "current",
      label: `Back to Room ${activeCode}`,
      icon: "▶",
      action: openRoom,
    });
  }

  // Remembered from a previous session
  if (rememberedCode && rememberedCode !== activeCode) {
    items.push({
      id: "rejoin",
      label: `Rejoin ${rememberedCode}`,
      subtitle: "From your last visit",
      action: () => void handleRejoin(rememberedCode),
      hasArrow: true,
    });
  }

  items.push(
    {
      id: "create",
      label: joining || busy ? "Creating…" : "Create a Room",
      icon: "+",
      action: () => void handleCreate(),
      hasArrow: true,
    },
    {
      id: "join",
      label: "Join with Code…",
      icon: "→",
      screen: "party-join" as const,
      hasArrow: true,
    },
    {
      id: "name",
      label: "Your Name",
      subtitle: "Shown to others in the room",
      action: () => {
        const name = window.prompt("Your display name");
        if (name && name.trim()) setMemberName(name.trim().slice(0, 24));
        pop(); // refresh subtitles on re-entry
      },
    }
  );

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div
          className="px-3 py-1.5 text-center"
          style={{
            fontFamily: "'Chicago', 'SF Pro Text', system-ui",
            fontSize: "10px",
            color: "#8a2f2f",
          }}
          role="alert"
        >
          {error}
        </div>
      )}
      <MenuList items={items} />
    </div>
  );
}
