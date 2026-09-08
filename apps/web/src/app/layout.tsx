import type { Metadata } from "next";
import type { ReactNode } from "react";
import { colors, lightColors, hexToRgbTriplet } from "@ipskill/shared";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/session-provider-wrapper";
import { ThemeProvider, ThemeFlashGuard } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "IPSkill — Unique Skills, Perfect Match.",
  description: "The developer hub for verified, skill-validated tech candidates.",
};

// Generated from packages/shared's colors/lightColors at render time — the
// single source of truth for these values, rather than hand-copied hex
// numbers living separately in globals.css.
const THEME_VARS_CSS = `
:root {
  --color-background: ${hexToRgbTriplet(colors.background)};
  --color-background-elevated: ${hexToRgbTriplet(colors.backgroundElevated)};
  --color-surface: ${hexToRgbTriplet(colors.surface)};
  --color-surface-border: ${hexToRgbTriplet(colors.surfaceBorder)};
  --color-text-secondary: ${hexToRgbTriplet(colors.textSecondary)};
  --color-text-muted: ${hexToRgbTriplet(colors.textMuted)};
  --color-heading: ${hexToRgbTriplet(colors.textPrimary)};
}
[data-theme="light"] {
  --color-background: ${hexToRgbTriplet(lightColors.background)};
  --color-background-elevated: ${hexToRgbTriplet(lightColors.backgroundElevated)};
  --color-surface: ${hexToRgbTriplet(lightColors.surface)};
  --color-surface-border: ${hexToRgbTriplet(lightColors.surfaceBorder)};
  --color-text-secondary: ${hexToRgbTriplet(lightColors.textSecondary)};
  --color-text-muted: ${hexToRgbTriplet(lightColors.textMuted)};
  --color-heading: ${hexToRgbTriplet(lightColors.heading)};
}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: THEME_VARS_CSS }} />
        <ThemeFlashGuard />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <SessionProviderWrapper>{children}</SessionProviderWrapper>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
