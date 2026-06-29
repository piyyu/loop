"use client";

import { useCallback, useRef, useEffect } from "react";
import { useSettingsStore } from "@/stores/settings-store";

interface ClickWheelState {
  isRotating: boolean;
  scrollDirection: "up" | "down" | null;
  angle: number;
}

interface UseClickWheelOptions {
  onScrollUp: () => void;
  onScrollDown: () => void;
  sensitivity?: number; // degrees needed per tick
}

export function useClickWheel({
  onScrollUp,
  onScrollDown,
  sensitivity = 15,
}: UseClickWheelOptions) {
  const lastAngleRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const centerRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef<ClickWheelState>({
    isRotating: false,
    scrollDirection: null,
    angle: 0,
  });

  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const getAngle = useCallback(
    (clientX: number, clientY: number): number => {
      const { x, y } = centerRef.current;
      return Math.atan2(clientY - y, clientX - x) * (180 / Math.PI);
    },
    []
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number, element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      // Check if pointer is on the outer ring (not center button)
      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const outerRadius = rect.width / 2;
      const innerRadius = outerRadius * 0.35; // center button is ~35% radius

      if (distance < innerRadius || distance > outerRadius) {
        return; // Not on the wheel ring
      }

      lastAngleRef.current = getAngle(clientX, clientY);
      accumulatedRef.current = 0;
      stateRef.current.isRotating = true;
    },
    [getAngle]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (
        lastAngleRef.current === null ||
        !stateRef.current.isRotating
      )
        return;

      const currentAngle = getAngle(clientX, clientY);
      let delta = currentAngle - lastAngleRef.current;

      // Handle angle wrap-around
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      accumulatedRef.current += delta;
      lastAngleRef.current = currentAngle;
      stateRef.current.angle = currentAngle;

      // Fire scroll events when accumulated rotation exceeds sensitivity
      if (Math.abs(accumulatedRef.current) >= sensitivity) {
        const direction = accumulatedRef.current > 0 ? "down" : "up";
        stateRef.current.scrollDirection = direction;

        if (direction === "up") {
          onScrollUp();
        } else {
          onScrollDown();
        }

        // Haptic tick
        if (hapticEnabled && navigator.vibrate) {
          navigator.vibrate(8);
        }

        accumulatedRef.current = 0;
      }
    },
    [getAngle, sensitivity, onScrollUp, onScrollDown, hapticEnabled]
  );

  const handleEnd = useCallback(() => {
    lastAngleRef.current = null;
    stateRef.current.isRotating = false;
    stateRef.current.scrollDirection = null;
    accumulatedRef.current = 0;
  }, []);

  // Pointer event handlers for the wheel element
  const wheelProps = useCallback(
    () => ({
      onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handleStart(e.clientX, e.clientY, e.currentTarget);
      },
      onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
      },
      onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        handleEnd();
      },
      onPointerCancel: () => {
        handleEnd();
      },
    }),
    [handleStart, handleMove, handleEnd]
  );

  return {
    wheelProps,
    isRotating: stateRef.current.isRotating,
  };
}
