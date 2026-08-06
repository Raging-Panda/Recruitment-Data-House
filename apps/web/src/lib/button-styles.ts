export type ButtonVariant = "primary" | "white" | "ghost" | "danger" | "subtle";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary-gradient text-white hover:opacity-90",
  white: "bg-white text-gray-900 hover:bg-gray-100",
  ghost: "border border-surface-border bg-surface/60 text-text-secondary hover:text-white",
  danger: "bg-accent-red/15 text-accent-red hover:bg-accent-red/25",
  subtle: "bg-surface text-text-secondary hover:text-white",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-4 py-3 text-sm",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`.trim();
}
