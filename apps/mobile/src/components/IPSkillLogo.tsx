import React from "react";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";

export function IPSkillLogo({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={48} stroke="#7C3AED" strokeWidth={1.5} opacity={0.25} fill="none" />
      {[42, 36, 30, 24, 18].map((r, i) => (
        <Path
          key={r}
          d={`M ${50 - r} 50 a ${r} ${r} 0 1 1 ${r * 2} 0`}
          stroke="#A855F7"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={1 - i * 0.12}
          fill="none"
        />
      ))}
      <SvgText x={50} y={58} textAnchor="middle" fontSize={24} fontWeight="800" fill="#F5F5FA">
        IP
      </SvgText>
    </Svg>
  );
}
