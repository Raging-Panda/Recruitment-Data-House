/**
 * CSS-variable-backed color strings for contexts that can't use Tailwind
 * classes (inline SVG attributes, recharts props) but still need to react
 * to the dark/light theme toggle — see globals.css for the variables and
 * theme-provider.tsx for how `data-theme` gets set. Brand/accent colors
 * (colors.purple, colors.violet, etc. from @ipskill/shared) stay constant
 * across themes and don't need this — only the structural surface/text
 * tokens do.
 */
export const themeColor = {
  surface: "rgb(var(--color-surface))",
  surfaceBorder: "rgb(var(--color-surface-border))",
  textSecondary: "rgb(var(--color-text-secondary))",
  textMuted: "rgb(var(--color-text-muted))",
  heading: "rgb(var(--color-heading))",
} as const;
