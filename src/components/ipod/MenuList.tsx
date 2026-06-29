"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    const { currentScreen, screenStack } = useNavigationStore.getState();
    if (currentScreen) {
      const currentItems = currentScreen.items || [];
      const hasChanged =
        currentItems.length !== items.length ||
        items.some((item, index) => item.id !== currentItems[index]?.id);

      if (hasChanged) {
        const updatedScreen = { ...currentScreen, items };
        const updatedStack = screenStack.map((s) =>
          s.id === currentScreen.id ? updatedScreen : s
        );
        useNavigationStore.setState({
          currentScreen: updatedScreen,
          screenStack: updatedStack,
        });
      }
    }
  }, [items]);

  // Calculate visible window (iPod shows ~5-6 items at a time)
  const visibleCount = 6;
  const startIndex = Math.max(
    0,
    Math.min(activeIndex - 2, items.length - visibleCount)
  );
  const visibleItems = items.slice(startIndex, startIndex + visibleCount);

  return (
    <div
      className="h-full overflow-hidden"
      style={{
        fontFamily: "'Chicago', 'SF Pro Text', system-ui, sans-serif",
        fontSize: "13px",
      }}
      role="listbox"
      aria-label="Menu items"
    >
      {visibleItems.map((item, idx) => {
        const realIndex = startIndex + idx;
        const isSelected = realIndex === activeIndex;

        return (
          <div
            key={item.id}
            className="flex items-center justify-between px-3 transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              height: "34px",
              background: isSelected ? highlightBg : "transparent",
              color: isSelected ? highlightText : normalText,
            }}
            onClick={() => {
              useNavigationStore.getState().setSelectedIndex(realIndex);
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
                <div className="truncate font-medium">{item.label}</div>
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

      {/* Scrollbar indicator */}
      {items.length > visibleCount && (
        <div
          className="absolute right-0 top-0 bottom-0 w-[3px]"
          style={{
            background: darkMode
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="w-full rounded-full transition-all duration-150"
            style={{
              background: darkMode
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.15)",
              height: `${(visibleCount / items.length) * 100}%`,
              marginTop: `${(startIndex / items.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
