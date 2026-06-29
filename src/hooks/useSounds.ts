"use client";

import { useCallback, useRef, useEffect } from "react";
import { Howl } from "howler";
import { useSettingsStore } from "@/stores/settings-store";

const SOUNDS = {
  click: "/sounds/click.mp3",
  select: "/sounds/select.mp3",
  startup: "/sounds/startup.mp3",
  shutdown: "/sounds/shutdown.mp3",
} as const;

type SoundName = keyof typeof SOUNDS;

export function useSounds() {
  const enabled = useSettingsStore((s) => s.clickSounds);
  const soundsRef = useRef<Record<string, Howl>>({});

  // Preload sounds
  useEffect(() => {
    if (!enabled) return;

    Object.entries(SOUNDS).forEach(([name, src]) => {
      if (!soundsRef.current[name]) {
        soundsRef.current[name] = new Howl({
          src: [src],
          volume: 0.3,
          preload: true,
        });
      }
    });
  }, [enabled]);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      soundsRef.current[name]?.play();
    },
    [enabled]
  );

  const click = useCallback(() => play("click"), [play]);
  const select = useCallback(() => play("select"), [play]);
  const startup = useCallback(() => play("startup"), [play]);
  const shutdown = useCallback(() => play("shutdown"), [play]);

  return { play, click, select, startup, shutdown };
}
