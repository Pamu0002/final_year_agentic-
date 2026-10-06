"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDarkMode, getServerDarkMode, subscribeToTheme, toggleTheme } from "@/lib/theme";

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeToTheme, getDarkMode, getServerDarkMode);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      role="switch"
      aria-label="Dark mode"
      aria-checked={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
    >
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
    </Button>
  );
}
