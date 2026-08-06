import React from "react";
import Svg, { Path, Circle, type SvgProps } from "react-native-svg";

type IconProps = Omit<SvgProps, "viewBox"> & { size?: number; color?: string };

function Base({ size = 22, color = "currentColor", children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </Svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M3 11.5 12 4l9 7.5" />
      <Path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </Base>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx="11" cy="11" r="6.5" />
      <Path d="m20 20-4.3-4.3" />
    </Base>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 5.5h16v11H9l-4 3.5v-3.5H4Z" />
    </Base>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx="12" cy="8" r="3.5" />
      <Path d="M4.5 20c1.2-3.5 4-5.5 7.5-5.5s6.3 2 7.5 5.5" />
    </Base>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M5 20V10" />
      <Path d="M12 20V4" />
      <Path d="M19 20v-7" />
    </Base>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 12h16" />
      <Path d="m13 6 6 6-6 6" />
    </Base>
  );
}
