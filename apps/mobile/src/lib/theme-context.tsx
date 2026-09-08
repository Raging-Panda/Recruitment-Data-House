import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { colors as darkColors, lightColors } from "@ipskill/shared";

const THEME_KEY = "ipskill_theme";

export type ThemeMode = "dark" | "light";

/**
 * Same split as web: background/surface/border/text-secondary/text-muted
 * flip with the mode, brand/accent colors stay constant. "heading" is new
 * here (mobile screens use it for primary text/icons that need to flip,
 * distinct from `white`, which stays pure white in both modes for things
 * like button labels on a solid purple background).
 */
function resolveColors(mode: ThemeMode) {
  if (mode === "light") {
    return {
      ...darkColors,
      background: lightColors.background,
      backgroundElevated: lightColors.backgroundElevated,
      surface: lightColors.surface,
      surfaceBorder: lightColors.surfaceBorder,
      textSecondary: lightColors.textSecondary,
      textMuted: lightColors.textMuted,
      heading: lightColors.heading,
    };
  }
  return { ...darkColors, heading: darkColors.textPrimary };
}

export type ThemeColors = ReturnType<typeof resolveColors>;

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") setMode(stored);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      SecureStore.setItemAsync(THEME_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, colors: resolveColors(mode), toggleTheme }),
    [mode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
