import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/lib/auth-context";
import { useTheme, type ThemeColors } from "@/lib/theme-context";
import { BrandedLoadingScreen } from "@/components/BrandedLoadingScreen";
import { SendIcon } from "@/components/icons";
import {
  getThread,
  sendMessage as sendMessageApi,
  respondToRequest,
  type MessageItem,
  type ThreadResponse,
} from "@/lib/mobile-api";
import type { MessagesStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MessagesStackParamList, "MessageThread">;

export function MessageThreadScreen({ route, navigation }: Props) {
  const { conversationId, otherName } = route.params;
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [thread, setThread] = useState<ThreadResponse | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getThread(accessToken, conversationId);
      setThread(data);
    } catch {
      setThread({
        messages: [],
        viewerId: "",
        status: "accepted",
        isPendingOnMe: false,
        otherName: otherName ?? "them",
        otherAvatarUrl: null,
      });
    }
  }, [accessToken, conversationId, otherName]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    navigation.setOptions({ title: thread?.otherName ?? otherName ?? "Conversation" });
  }, [navigation, thread?.otherName, otherName]);

  async function send() {
    if (!accessToken || !body.trim()) return;
    setBusy(true);
    try {
      await sendMessageApi(accessToken, conversationId, body.trim());
      setBody("");
      await load();
    } catch {
      // best-effort — the thread just won't show the new message
    } finally {
      setBusy(false);
    }
  }

  async function respond(action: "accept" | "decline") {
    if (!accessToken) return;
    setBusy(true);
    try {
      await respondToRequest(accessToken, conversationId, action);
      if (action === "decline") {
        navigation.goBack();
      } else {
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!thread) {
    return <BrandedLoadingScreen label="Loading conversation…" />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={thread.messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }: { item: MessageItem }) => (
          <View style={[styles.bubble, item.senderId === thread.viewerId && styles.bubbleMine]}>
            <Text style={[styles.bubbleText, item.senderId === thread.viewerId && styles.bubbleTextMine]}>
              {item.body}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Say hello to {thread.otherName}.</Text>}
      />

      {thread.isPendingOnMe ? (
        <View style={styles.requestBar}>
          <Text style={styles.requestText}>{thread.otherName} wants to message you.</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={styles.declineButton} onPress={() => respond("decline")} disabled={busy}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={() => respond("accept")} disabled={busy}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.composer}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write a message…"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={2000}
          />
          <TouchableOpacity onPress={send} disabled={busy || !body.trim()} style={styles.sendButton}>
            <SendIcon size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    bubble: {
      alignSelf: "flex-start",
      maxWidth: "78%",
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    bubbleMine: { alignSelf: "flex-end", backgroundColor: colors.primary },
    bubbleText: { color: colors.heading, fontSize: 14 },
    bubbleTextMine: { color: colors.white },
    empty: { color: colors.textMuted, textAlign: "center", marginTop: 40 },
    composer: {
      flexDirection: "row",
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      alignItems: "center",
    },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: colors.heading,
      fontSize: 14,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    requestBar: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
      gap: 10,
    },
    requestText: { color: colors.textSecondary, fontSize: 13 },
    declineButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    declineText: { color: colors.textSecondary, fontWeight: "600" },
    acceptButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    acceptText: { color: colors.white, fontWeight: "600" },
  });
}
