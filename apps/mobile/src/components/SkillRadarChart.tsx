import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polygon, Line, Circle } from "react-native-svg";
import type { SkillFingerprint } from "@ipskill/shared";
import { colors } from "@ipskill/shared";

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_RADIUS = SIZE / 2 - 40;

export function SkillRadarChart({ fingerprint }: { fingerprint: SkillFingerprint }) {
  const entries = Object.entries(fingerprint);
  const angleStep = (2 * Math.PI) / entries.length;

  const pointFor = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / 100) * MAX_RADIUS;
    return {
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
    };
  };

  const dataPoints = entries.map(([, value], i) => pointFor(value, i));
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {gridLevels.map((level) => {
          const gridPoints = entries
            .map((_, i) => pointFor(level * 100, i))
            .map((p) => `${p.x},${p.y}`)
            .join(" ");
          return (
            <Polygon
              key={level}
              points={gridPoints}
              stroke={colors.surfaceBorder}
              strokeWidth={1}
              fill="none"
            />
          );
        })}

        {entries.map((_, i) => {
          const outer = pointFor(100, i);
          return (
            <Line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={outer.x}
              y2={outer.y}
              stroke={colors.surfaceBorder}
              strokeWidth={1}
            />
          );
        })}

        <Polygon
          points={dataPolygon}
          stroke={colors.violet}
          strokeWidth={2}
          fill={colors.purple}
          fillOpacity={0.5}
        />
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.violet} />
        ))}
      </Svg>

      {entries.map(([category], i) => {
        const angle = angleStep * i - Math.PI / 2;
        const labelRadius = MAX_RADIUS + 22;
        const x = CENTER + labelRadius * Math.cos(angle);
        const y = CENTER + labelRadius * Math.sin(angle);
        return (
          <Text
            key={category}
            style={[
              styles.label,
              {
                left: x - 40,
                top: y - 8,
              },
            ]}
          >
            {category}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignSelf: "center",
  },
  label: {
    position: "absolute",
    width: 80,
    textAlign: "center",
    fontSize: 10,
    color: "#9797B5",
  },
});
