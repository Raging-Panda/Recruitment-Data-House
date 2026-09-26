import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/lib/auth-context";
import { useTheme, type ThemeColors } from "@/lib/theme-context";
import { BrandedLoadingScreen } from "@/components/BrandedLoadingScreen";
import { listConversations, type ConversationSummary } from "@/lib/mobile-api";
import type { MessagesStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MessagesStackParamList, "MessagesHome">;

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function MessagesScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const { conversations: list } = await listConversations(accessToken);
      setConversations(list);
    } catch {
      setConversations([]);
    }
  }, [accessToken]);

  // Refetch on every focus (not just first mount) — coming back from a
  // thread should show its updated last-message/unread state without a
  // manual pull-to-refresh.
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

  if (conversations === null) {
    return <BrandedLoadingScreen label="Loading messages…" />;
  }

  const requests = conversations.filter((c) => c.isIncomingRequest);
  const rest = conversations.filter((c) => !c.isIncomingRequest);
  const sections = [...requests, ...rest];

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Messages</Text>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate("MessageThread", { conversationId: item.id, otherName: item.otherName })
            }
          >
            {item.otherAvatarUrl ? (
              <Image source={{ uri: item.otherAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.otherName}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessage ?? "No messages yet"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
              {item.isIncomingRequest ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Request</Text>
                </View>
              ) : item.status === "pending" ? (
                <Text style={styles.pending}>Pending</Text>
              ) : (
                item.unread && <View style={styles.dot} />
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    headerTitle: { color: colors.heading, fontSize: 22, fontWeight: "700", paddingTop: 16, paddingBottom: 12 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary },
    name: { color: colors.heading, fontSize: 15, fontWeight: "600" },
    preview: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
    time: { color: colors.textMuted, fontSize: 11 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    pending: { color: colors.textMuted, fontSize: 10, textTransform: "uppercase" },
    badge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },
    empty: { color: colors.textMuted, textAlign: "center", marginTop: 40 },
  });
}
