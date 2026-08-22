"use client";

import { useState } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { useRoomStore } from "@/stores/room-store";
import { MenuList } from "@/components/ipod/MenuList";
import { unlockAudio } from "@/lib/audio-registry";

/**
 * Join a listen-together room by its 4-character code.
 */
export function PartyJoinScreen() {
  const { push, pop } = useNavigationStore();
  const joinRoom = useRoomStore((s) => s.joinRoom);
  const joining = useRoomStore((s) => s.joining);
  const error = useRoomStore((s) => s.error);
  const [code, setCode] = useState("");

  const handleJoin = async () => {
    if (code.trim().length < 4) return;
    unlockAudio();
    if (await joinRoom(code.trim())) {
      push({
        id: "party-room",
        title: code.trim().toUpperCase(),
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Code input */}
      <div
        className="px-3 py-2"
        style={{
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          fontFamily: "'Chicago', 'SF Pro Text', system-ui",
        }}
      >
        <input
          type="text"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleJoin();
          }}
          placeholder="ROOM CODE"
          autoFocus
          aria-label="Room code"
          className="w-full bg-transparent outline-none text-center tracking-[6px]"
          style={{ fontSize: "18px", fontWeight: 700 }}
        />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {error && (
          <div className="px-3 py-1.5 text-center text-[10px]" role="alert" style={{ color: "#8a2f2f" }}>
            {error}
          </div>
        )}
        <MenuList
          items={[
            {
              id: "go",
              label: joining ? "Joining…" : `Join ${code || "…"}`,
              icon: "→",
              action: () => void handleJoin(),
            },
            {
              id: "back",
              label: "Cancel",
              action: () => pop(),
            },
          ]}
        />
      </div>
    </div>
  );
}
