import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SkillRadarChart } from "@/components/SkillRadarChart";
import { useDeveloperHubData } from "@/lib/use-developer-hub-data";
import { theme } from "@/theme";
import type { ProfileStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileHome">;

const TOP_TABS = ["My Skills", "Stats"] as const;
const SEGMENTS = ["Skills", "Projects", "About"] as const;

export function ProfileScreen({ navigation }: Props) {
  const { data, isLoading, error } = useDeveloperHubData();
  const [topTab, setTopTab] = useState<(typeof TOP_TABS)[number]>("My Skills");
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>("Skills");

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? "No data available"}</Text>
      </View>
    );
  }

  const { profile, skillFingerprint } = data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Skills</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Analytics")}>
          <Text style={styles.headerIcon}>📊</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topTabs}>
        {TOP_TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setTopTab(tab)}>
            <Text style={[styles.topTab, topTab === tab && styles.topTabActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.profileRow}>
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.headline}>{profile.headline}</Text>
          {profile.location && <Text style={styles.location}>📍 {profile.location}</Text>}
          {profile.availableForOpportunities && (
            <Text style={styles.available}>● Available for opportunities</Text>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.overallScore}%</Text>
          <Text style={styles.statLabel}>Overall Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>Top {profile.percentileRank}%</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
      </View>

      <View style={styles.segments}>
        {SEGMENTS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => {
              if (s === "Projects") {
                navigation.navigate("Projects");
              } else {
                setSegment(s);
              }
            }}
          >
            <Text style={[styles.segment, segment === s && styles.segmentActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {segment === "Skills" && (
        <>
          <Text style={styles.sectionTitle}>Skill Fingerprint</Text>
          <SkillRadarChart fingerprint={skillFingerprint} />
        </>
      )}
      {segment === "About" && (
        <Text style={styles.about}>{profile.about ?? "No bio provided on GitHub yet."}</Text>
      )}
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
  errorText: { color: theme.colors.textSecondary, paddingHorizontal: 24, textAlign: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
  },
  headerTitle: { color: theme.colors.white, fontSize: 18, fontWeight: "700" },
  headerIcon: { fontSize: 18 },
  topTabs: { flexDirection: "row", gap: 24, marginTop: 16 },
  topTab: { color: theme.colors.textSecondary, fontSize: 14, paddingBottom: 8 },
  topTabActive: {
    color: theme.colors.primary,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  profileRow: { flexDirection: "row", gap: 12, marginTop: 20, alignItems: "center" },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  name: { color: theme.colors.white, fontSize: 16, fontWeight: "700" },
  headline: { color: theme.colors.textSecondary, fontSize: 13 },
  location: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  available: { color: theme.colors.accentGreen, fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  statValue: { color: theme.colors.white, fontSize: 20, fontWeight: "800" },
  statLabel: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  segments: { flexDirection: "row", gap: 20, marginTop: 24 },
  segment: { color: theme.colors.textSecondary, fontSize: 14, paddingBottom: 8 },
  segmentActive: {
    color: theme.colors.primary,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  sectionTitle: { color: theme.colors.white, fontSize: 14, fontWeight: "600", marginTop: 16 },
  about: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 16, lineHeight: 20 },
});
