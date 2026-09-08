import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { IPSkillLogo } from "./IPSkillLogo";
import { useTheme, type ThemeColors } from "@/lib/theme-context";

export function BrandedLoadingScreen({ label }: { label?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <IPSkillLogo size={72} />
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    spinner: { marginTop: 24 },
    label: { marginTop: 12, color: colors.textSecondary, fontSize: 13 },
  });
}
