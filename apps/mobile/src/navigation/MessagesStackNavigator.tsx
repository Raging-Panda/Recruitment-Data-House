import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MessagesScreen } from "@/screens/MessagesScreen";
import { MessageThreadScreen } from "@/screens/MessageThreadScreen";
import { useTheme } from "@/lib/theme-context";
import type { MessagesStackParamList } from "./types";

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStackNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.backgroundElevated },
        headerTintColor: colors.heading,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="MessagesHome" component={MessagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MessageThread" component={MessageThreadScreen} options={{ title: "" }} />
    </Stack.Navigator>
  );
}
