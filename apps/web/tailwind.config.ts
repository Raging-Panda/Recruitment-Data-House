import type { Config } from "tailwindcss";
import { colors } from "@ipskill/shared";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-dependent (see globals.css :root / [data-theme="light"]) —
        // these are the only tokens that flip between dark and light mode.
        background: "rgb(var(--color-background) / <alpha-value>)",
        "background-elevated": "rgb(var(--color-background-elevated) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-border": "rgb(var(--color-surface-border) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        heading: "rgb(var(--color-heading) / <alpha-value>)",
        // Brand/accent colors stay constant across both themes.
        primary: colors.primary,
        "primary-from": colors.primaryGradientFrom,
        "primary-to": colors.primaryGradientTo,
        "accent-pink": colors.accentPink,
        "accent-green": colors.accentGreen,
        "accent-amber": colors.accentAmber,
        "accent-red": colors.accentRed,
        "light-gray": colors.lightGray,
        navy: colors.navy,
        purple: colors.purple,
        violet: colors.violet,
        indigo: colors.indigo,
        "midnight-blue": colors.midnightBlue,
        "deep-navy": colors.deepNavy,
      },
      backgroundImage: {
        "primary-gradient": `linear-gradient(135deg, ${colors.primaryGradientFrom} 0%, ${colors.primaryGradientTo} 100%)`,
      },
    },
  },
  plugins: [],
};

export default config;
