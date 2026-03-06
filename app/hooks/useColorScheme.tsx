import { useEffect, useState } from "react";

export type ColorScheme = "light" | "dark" | "system";

const STORAGE_KEY = "color-scheme";

function getStoredColorScheme(): ColorScheme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function applyColorScheme(scheme: ColorScheme) {
  if (typeof window === "undefined") return;
  const isDark =
    scheme === "dark" ||
    (scheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function useColorScheme() {
  const [colorScheme, setColorScheme] =
    useState<ColorScheme>(getStoredColorScheme);

  useEffect(() => {
    applyColorScheme(colorScheme);
    localStorage.setItem(STORAGE_KEY, colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    if (colorScheme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyColorScheme("system");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [colorScheme]);

  return { colorScheme, setColorScheme };
}
