import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/lib/auth-context";
import { useTheme, type ThemeColors } from "@/lib/theme-context";
import { BrandedLoadingScreen } from "@/components/BrandedLoadingScreen";
import { listInterviews, bookInterview, cancelInterview, type InterviewRequest } from "@/lib/mobile-api";
import { config } from "@/lib/config";
import type { ProfileStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<ProfileStackParamList, "Interviews">;

function formatSlot(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InterviewsScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [interviews, setInterviews] = useState<InterviewRequest[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const { interviews: list } = await listInterviews(accessToken);
      setInterviews(list);
    } catch {
      setInterviews([]);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  async function book(id: string, slot: string) {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await bookInterview(accessToken, id, slot);
      await load();
    } catch {
      // best-effort — the card just won't update
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(id: string) {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await cancelInterview(accessToken, id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (interviews === null) {
    return <BrandedLoadingScreen label="Loading interviews…" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={interviews}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No interviews yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>
                  With {item.otherName} · {item.durationMinutes} min
                </Text>
              </View>
              <View style={[styles.statusPill, statusStyle(item.status, colors)]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            {item.status === "pending" && (
              <View style={{ marginTop: 10, gap: 8 }}>
                <Text style={styles.pickLabel}>Pick a time:</Text>
                {item.proposedSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={styles.slotButton}
                    disabled={busyId === item.id}
                    onPress={() => book(item.id, slot)}
                  >
                    <Text style={styles.slotText}>{formatSlot(slot)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {item.status === "booked" && item.selectedSlot && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.bookedTime}>{formatSlot(item.selectedSlot)}</Text>
                <TouchableOpacity
                  style={styles.calendarLink}
                  onPress={() => Linking.openURL(`${config.authBackendUrl}/dashboard/interviews`)}
                >
                  <Text style={styles.calendarLinkText}>Add to calendar (Google/Outlook/.ics) →</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status !== "cancelled" && (
              <TouchableOpacity style={styles.cancelButton} disabled={busyId === item.id} onPress={() => cancel(item.id)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

function statusStyle(status: InterviewRequest["status"], colors: ThemeColors) {
  if (status === "booked") return { backgroundColor: `${colors.accentGreen}26` };
  if (status === "cancelled") return { backgroundColor: colors.surface };
  return { backgroundColor: `${colors.primary}26` };
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 16 },
    back: { color: colors.heading, fontSize: 24 },
    headerTitle: { color: colors.heading, fontSize: 18, fontWeight: "700" },
    card: {
      marginTop: 14,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    title: { color: colors.heading, fontSize: 15, fontWeight: "600" },
    meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    statusPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { color: colors.heading, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
    pickLabel: { color: colors.textSecondary, fontSize: 12 },
    slotButton: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    slotText: { color: colors.heading, fontSize: 13 },
    bookedTime: { color: colors.heading, fontSize: 14, fontWeight: "600" },
    calendarLink: { marginTop: 6 },
    calendarLinkText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
    cancelButton: { marginTop: 10, alignSelf: "flex-start" },
    cancelText: { color: colors.accentRed, fontSize: 12, fontWeight: "600" },
    empty: { color: colors.textMuted, textAlign: "center", marginTop: 40 },
  });
}
