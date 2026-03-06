import { createContext, useContext, useEffect, useState } from "react";

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

type ColorSchemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export function ColorSchemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorScheme, setColorScheme] =
    useState<ColorScheme>(getStoredColorScheme);

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) =>
      setSystemDark(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    setSystemDark(mediaQuery.matches);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const isDark =
    colorScheme === "dark" || (colorScheme === "system" && systemDark);

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, setColorScheme, isDark }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx)
    throw new Error("useColorScheme must be used inside ColorSchemeProvider");
  return ctx;
}
