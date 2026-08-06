import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDeveloperHubData } from "@/lib/use-developer-hub-data";
import { theme } from "@/theme";
import type { ProfileStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<ProfileStackParamList, "Analytics">;

export function AnalyticsScreen({ navigation }: Props) {
  const { data, isLoading } = useDeveloperHubData();

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const { analytics } = data;
  const stats = [
    {
      label: "Profile Views",
      value: analytics.profileViews.toLocaleString(),
      change: analytics.profileViewsChangePct,
    },
    {
      label: "Search Appearances",
      value: analytics.searchAppearances.toLocaleString(),
      change: analytics.searchAppearancesChangePct,
    },
    {
      label: "Connection Requests",
      value: analytics.connectionRequests.toLocaleString(),
      change: analytics.connectionRequestsChangePct,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerIcon}>This Month ▾</Text>
      </View>

      {stats.map((stat) => (
        <View key={stat.label} style={styles.card}>
          <Text style={styles.cardLabel}>{stat.label}</Text>
          <View style={styles.cardValueRow}>
            <Text style={styles.cardValue}>{stat.value}</Text>
            <Text style={styles.cardChange}>↑ {stat.change}% vs last month</Text>
          </View>
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Top Countries</Text>
        {analytics.topCountries.map((c) => (
          <View key={c.country} style={styles.countryRow}>
            <Text style={styles.countryName}>{c.country}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${c.percentage}%` }]} />
            </View>
            <Text style={styles.countryPct}>{c.percentage}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 20 },
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    marginBottom: 20,
  },
  back: { color: theme.colors.white, fontSize: 24 },
  headerTitle: { color: theme.colors.white, fontSize: 18, fontWeight: "700" },
  headerIcon: { color: theme.colors.textSecondary, fontSize: 12 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: { color: theme.colors.textSecondary, fontSize: 13 },
  cardValueRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 6 },
  cardValue: { color: theme.colors.white, fontSize: 24, fontWeight: "800" },
  cardChange: { color: theme.colors.accentGreen, fontSize: 12 },
  countryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  countryName: { color: theme.colors.textSecondary, fontSize: 12, width: 90 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.colors.backgroundElevated },
  barFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
  countryPct: { color: theme.colors.textSecondary, fontSize: 12, width: 32, textAlign: "right" },
});
