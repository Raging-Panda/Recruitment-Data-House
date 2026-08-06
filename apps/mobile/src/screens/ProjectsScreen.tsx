import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDeveloperHubData } from "@/lib/use-developer-hub-data";
import { theme } from "@/theme";
import type { ProfileStackParamList } from "@/navigation/types";
import type { DeveloperProject } from "@ipskill/shared";

type Props = NativeStackScreenProps<ProfileStackParamList, "Projects">;

const FILTERS = ["All", "Featured", "Personal", "Collaborations"] as const;

export function ProjectsScreen({ navigation }: Props) {
  const { data, isLoading } = useDeveloperHubData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const projects = (data?.projects ?? []).filter((p) => {
    if (filter === "All") return true;
    if (filter === "Collaborations") return p.category === "Collaboration";
    return p.category === filter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Projects</Text>
        <Text style={styles.headerIcon}>▦</Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}>
            <Text style={[styles.filter, filter === f && styles.filterActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => <ProjectRow project={item} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No repositories in this category yet.</Text>
          }
        />
      )}
    </View>
  );
}

function ProjectRow({ project }: { project: DeveloperProject }) {
  return (
    <View style={styles.row}>
      <View style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.projectMeta}>{project.languages.join(", ") || "—"}</Text>
        <Text style={styles.projectStats}>
          ⭐ {project.stars}   👁 {project.watchers}
        </Text>
      </View>
      <Text style={styles.year}>{new Date(project.updatedAt).getFullYear()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  back: { color: theme.colors.white, fontSize: 24 },
  headerTitle: { color: theme.colors.white, fontSize: 18, fontWeight: "700" },
  headerIcon: { color: theme.colors.textSecondary, fontSize: 16 },
  filters: { flexDirection: "row", gap: 16, marginTop: 20, marginBottom: 12 },
  filter: { color: theme.colors.textSecondary, fontSize: 13, paddingBottom: 6 },
  filterActive: {
    color: theme.colors.primary,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: theme.colors.surface },
  projectName: { color: theme.colors.white, fontSize: 14, fontWeight: "600" },
  projectMeta: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  projectStats: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  year: { color: theme.colors.textMuted, fontSize: 12 },
  empty: { color: theme.colors.textMuted, textAlign: "center", marginTop: 40 },
});
