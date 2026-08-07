import React, { useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDeveloperHubData } from "@/lib/use-developer-hub-data";
import { useTheme, type ThemeColors } from "@/lib/theme-context";
import type { ProfileStackParamList } from "@/navigation/types";
import type { DeveloperProject } from "@ipskill/shared";

type Props = NativeStackScreenProps<ProfileStackParamList, "Projects">;

const FILTERS = ["All", "Featured", "Personal", "Collaborations"] as const;

export function ProjectsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => <ProjectRow project={item} styles={styles} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No repositories in this category yet.</Text>
          }
        />
      )}
    </View>
  );
}

function ProjectRow({
  project,
  styles,
}: {
  project: DeveloperProject;
  styles: ReturnType<typeof createStyles>;
}) {
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 16,
    },
    back: { color: colors.heading, fontSize: 24 },
    headerTitle: { color: colors.heading, fontSize: 18, fontWeight: "700" },
    headerIcon: { color: colors.textSecondary, fontSize: 16 },
    filters: { flexDirection: "row", gap: 16, marginTop: 20, marginBottom: 12 },
    filter: { color: colors.textSecondary, fontSize: 13, paddingBottom: 6 },
    filterActive: {
      color: colors.primary,
      fontWeight: "700",
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    row: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.surface },
    projectName: { color: colors.heading, fontSize: 14, fontWeight: "600" },
    projectMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    projectStats: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    year: { color: colors.textMuted, fontSize: 12 },
    empty: { color: colors.textMuted, textAlign: "center", marginTop: 40 },
  });
}
