"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigationStore } from "@/stores/navigation-store";
import { useSettingsStore } from "@/stores/settings-store";

const EQ_BANDS = [
  { freq: "60", label: "60Hz" },
  { freq: "150", label: "150Hz" },
  { freq: "400", label: "400Hz" },
  { freq: "1k", label: "1kHz" },
  { freq: "2.4k", label: "2.4kHz" },
  { freq: "6k", label: "6kHz" },
  { freq: "15k", label: "15kHz" },
];

/**
 * Equalizer screen — visual EQ with frequency band sliders.
 */
export function EqualizerScreen() {
  const { darkMode } = useSettingsStore();
  const { selectedIndex } = useNavigationStore();
  const [bands, setBands] = useState<number[]>(EQ_BANDS.map(() => 50));

  const textColor = darkMode ? "#C8D8B8" : "#1a1a1a";
  const mutedColor = darkMode ? "#8A9A7A" : "#5A6A4A";
  const barColor = darkMode ? "#5A8A3A" : "#4A7A2A";
  const barBg = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div className="h-full flex flex-col px-3 py-3">
      <div
        className="text-center mb-3"
        style={{
          fontFamily: "Chicago, system-ui",
          fontSize: "11px",
          color: mutedColor,
        }}
      >
        Use wheel to adjust bands
      </div>

      {/* EQ bars */}
      <div className="flex-1 flex items-end justify-center gap-2">
        {EQ_BANDS.map((band, idx) => {
          const isSelected = idx === (selectedIndex % EQ_BANDS.length);
          const value = bands[idx];

          return (
            <div
              key={band.freq}
              className="flex flex-col items-center gap-1"
              style={{ flex: 1 }}
            >
              {/* Bar container */}
              <div
                className="relative w-full rounded-full overflow-hidden"
                style={{
                  height: "100px",
                  background: barBg,
                  border: isSelected
                    ? `1px solid ${barColor}`
                    : "1px solid transparent",
                }}
              >
                <motion.div
                  className="absolute bottom-0 left-0 right-0 rounded-full"
                  style={{
                    background: isSelected
                      ? barColor
                      : `${barColor}88`,
                  }}
                  animate={{ height: `${value}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: "7px",
                  color: isSelected ? textColor : mutedColor,
                  fontFamily: "Chicago, system-ui",
                }}
              >
                {band.freq}
              </span>
            </div>
          );
        })}
      </div>

      {/* dB indicator */}
      <div className="flex justify-between mt-2">
        <span style={{ fontSize: "8px", color: mutedColor, fontFamily: "Chicago, system-ui" }}>
          -12dB
        </span>
        <span style={{ fontSize: "8px", color: mutedColor, fontFamily: "Chicago, system-ui" }}>
          0dB
        </span>
        <span style={{ fontSize: "8px", color: mutedColor, fontFamily: "Chicago, system-ui" }}>
          +12dB
        </span>
      </div>
    </div>
  );
}
