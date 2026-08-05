export const colors = {
  background: "#0B0B1D",
  backgroundElevated: "#13132B",
  surface: "#1A1A35",
  surfaceBorder: "#2A2A4A",
  primary: "#7C3AED",
  primaryGradientFrom: "#4C1D95",
  primaryGradientTo: "#7C3AED",
  accentPink: "#EC4899",
  accentGreen: "#22C55E",
  textPrimary: "#F5F5FA",
  textSecondary: "#9797B5",
  textMuted: "#5E5E80",
  white: "#FFFFFF",
} as const;

export const gradients = {
  primaryButton: `linear-gradient(90deg, ${colors.primaryGradientFrom} 0%, ${colors.primaryGradientTo} 100%)`,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  logo: { size: 32, weight: 800 },
  h1: { size: 24, weight: 700 },
  h2: { size: 18, weight: 600 },
  body: { size: 14, weight: 400 },
  caption: { size: 12, weight: 400 },
} as const;

export const brand = {
  name: "IPSkill",
  tagline: "Unique Skills, Perfect Match.",
} as const;
