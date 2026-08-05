import type { Config } from "tailwindcss";
import { colors } from "@ipskill/shared";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: colors.background,
        "background-elevated": colors.backgroundElevated,
        surface: colors.surface,
        "surface-border": colors.surfaceBorder,
        primary: colors.primary,
        "primary-from": colors.primaryGradientFrom,
        "primary-to": colors.primaryGradientTo,
        "accent-pink": colors.accentPink,
        "accent-green": colors.accentGreen,
        "text-secondary": colors.textSecondary,
        "text-muted": colors.textMuted,
      },
      backgroundImage: {
        "primary-gradient": `linear-gradient(90deg, ${colors.primaryGradientFrom} 0%, ${colors.primaryGradientTo} 100%)`,
      },
    },
  },
  plugins: [],
};

export default config;
