"use client";

import { useCallback } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { triggerHaptic } from "@/utils/haptic";

export function useHaptic() {
  const enabled = useSettingsStore((s) => s.hapticFeedback);

  const tick = useCallback(() => {
    if (enabled) triggerHaptic("tick");
  }, [enabled]);

  const select = useCallback(() => {
    if (enabled) triggerHaptic("select");
  }, [enabled]);

  const error = useCallback(() => {
    if (enabled) triggerHaptic("error");
  }, [enabled]);

  return { tick, select, error };
}
