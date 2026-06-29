/**
 * Haptic feedback utility using the Vibration API
 */
export function triggerHaptic(
  pattern: "tick" | "select" | "error" = "tick"
): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;

  const patterns: Record<string, number | number[]> = {
    tick: 8,
    select: 25,
    error: [50, 30, 50],
  };

  try {
    navigator.vibrate(patterns[pattern]);
  } catch {
    // Vibration API not supported — silently fail
  }
}
