"use client";

import { useEffect } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";

/**
 * Keyboard navigation hook — maps keyboard keys to iPod actions.
 * Arrow keys = scroll, Enter = select, Escape/Backspace = menu back
 * Space = play/pause, Left/Right arrows = previous/next (when playing)
 */
export function useKeyboard() {
  const { scrollUp, scrollDown, select, pop, currentScreen } =
    useNavigationStore();
  const { togglePlay, next, previous, currentSong } = usePlayerStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          scrollUp();
          break;

        case "ArrowDown":
          e.preventDefault();
          scrollDown();
          break;

        case "Enter":
          e.preventDefault();
          select();
          break;

        case "Escape":
        case "Backspace":
          e.preventDefault();
          pop();
          break;

        case " ":
          e.preventDefault();
          if (currentSong) {
            togglePlay();
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (currentSong) {
            previous();
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (currentSong) {
            next();
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    scrollUp,
    scrollDown,
    select,
    pop,
    togglePlay,
    next,
    previous,
    currentSong,
    currentScreen,
  ]);
}
