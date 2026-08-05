import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/theme";

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Not built yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: theme.colors.white, fontSize: 18, fontWeight: "700" },
  subtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: 6 },
});
