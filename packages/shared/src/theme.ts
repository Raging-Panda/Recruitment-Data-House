export const colors = {
  background: "#05080F",
  backgroundElevated: "#0A1120",
  surface: "#111A2E",
  surfaceBorder: "#1E2A44",
  primary: "#5A18D6",
  primaryGradientFrom: "#5A18D6",
  primaryGradientTo: "#4020C4",
  navy: "#081C5A",
  purple: "#5A18D6",
  violet: "#4020C4",
  indigo: "#4020C4",
  midnightBlue: "#081C5A",
  deepNavy: "#1E293B",
  accentPink: "#EC4899",
  accentGreen: "#10B981",
  accentAmber: "#F59E0B",
  accentRed: "#EF4444",
  lightGray: "#F5F7FA",
  textPrimary: "#F5F5FA",
  textSecondary: "#9797B5",
  textMuted: "#5E5E80",
  white: "#FFFFFF",
} as const;

/**
 * Web's light-mode structural tokens — the only palette values that flip
 * with the [data-theme] toggle. Brand/accent colors above stay constant
 * across both themes by design, so they aren't duplicated here. Mobile
 * doesn't have a light mode.
 */
export const lightColors = {
  background: "#F5F7FA",
  backgroundElevated: "#FFFFFF",
  surface: "#E9ECF1",
  surfaceBorder: "#DDE2EA",
  textSecondary: "#5B6472",
  textMuted: "#8B93A1",
  heading: "#1E293B",
} as const;

export const gradients = {
  primaryButton: `linear-gradient(135deg, ${colors.primaryGradientFrom} 0%, ${colors.primaryGradientTo} 100%)`,
} as const;

/** "#RRGGBB" -> "R G B", the space-separated triplet format Tailwind's
 * `rgb(var(--x) / <alpha-value>)` opacity-modifier pattern requires. */
export function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

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
