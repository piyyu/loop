"use client";

import { useEffect, useRef } from "react";
import { useNavigationStore, SCREEN_DEFINITIONS } from "@/stores/navigation-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { MenuItem } from "@/types/navigation";

interface MenuListProps {
  items: MenuItem[];
  selectedIndex?: number;
}

/**
 * Reusable iPod-style menu list component.
 * Renders items with highlight bar on selected index.
 */
export function MenuList({ items, selectedIndex }: MenuListProps) {
  const storeIndex = useNavigationStore((s) => s.selectedIndex);
  const { darkMode } = useSettingsStore();
  const activeIndex = selectedIndex ?? storeIndex;

  const highlightBg = darkMode ? "#3A5A9D" : "#4A90D9";
  const highlightText = "#FFFFFF";
  const normalText = darkMode ? "#C8D8B8" : "#1a1a1a";
  const subtitleColor = darkMode ? "#8A9A7A" : "#5A6A4A";

  // Sync items to current screen store so that the click-wheel center select button is aware of current screen options
  const prevItemIdsRef = useRef<string>("");
  useEffect(() => {
    const itemIds = items.map((i) => i.id).join(",");
    if (itemIds === prevItemIdsRef.current) return;
    prevItemIdsRef.current = itemIds;

    const { currentScreen, screenStack } = useNavigationStore.getState();
    if (currentScreen) {
      const updatedScreen = { ...currentScreen, items };
      const updatedStack = screenStack.map((s) =>
        s.id === currentScreen.id ? updatedScreen : s
      );
      useNavigationStore.setState({
        currentScreen: updatedScreen,
        screenStack: updatedStack,
      });
    }
  }, [items]);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Auto scroll active item into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto scrollbar-none flex-1"
      style={{
        fontFamily: "'Chicago', 'SF Pro Text', system-ui, sans-serif",
        fontSize: "13.5px",
      }}
      role="listbox"
      aria-label="Menu items"
    >
      {items.map((item, idx) => {
        const isSelected = idx === activeIndex;

        return (
          <div
            key={item.id}
            ref={isSelected ? activeItemRef : null}
            className="flex items-center justify-between px-4 transition-colors cursor-pointer border-b border-black/[0.04] dark:border-white/[0.04] active:bg-black/5 dark:active:bg-white/5"
            style={{
              height: "46px",
              background: isSelected ? highlightBg : "transparent",
              color: isSelected ? highlightText : normalText,
            }}
            onClick={() => {
              useNavigationStore.getState().setSelectedIndex(idx);
              // Directly invoke action or navigation for immediate response
              if (item.action) {
                item.action();
              } else if (item.screen) {
                const screenDef = SCREEN_DEFINITIONS[item.screen];
                if (screenDef) {
                  useNavigationStore.getState().push(screenDef);
                } else {
                  useNavigationStore.getState().push({
                    id: item.screen,
                    title: item.label,
                    data: item.data,
                  });
                }
              }
            }}
            role="option"
            aria-selected={isSelected}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {item.icon && (
                <span
                  className="text-sm flex-shrink-0"
                  style={{
                    opacity: isSelected ? 1 : 0.7,
                    width: "18px",
                    textAlign: "center",
                  }}
                >
                  {item.icon}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{item.label}</div>
                {item.subtitle && (
                  <div
                    className="truncate text-[10px]"
                    style={{
                      color: isSelected ? "rgba(255,255,255,0.7)" : subtitleColor,
                    }}
                  >
                    {item.subtitle}
                  </div>
                )}
              </div>
            </div>

            {item.hasArrow && (
              <span
                className="text-sm flex-shrink-0 ml-1"
                style={{ opacity: isSelected ? 1 : 0.4 }}
              >
                ›
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
