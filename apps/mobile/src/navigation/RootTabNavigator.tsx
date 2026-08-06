import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PlaceholderScreen } from "@/screens/PlaceholderScreen";
import { ProfileStackNavigator } from "./ProfileStackNavigator";
import { theme } from "@/theme";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

function HomeScreen() {
  return <PlaceholderScreen title="Home" />;
}
function SearchScreen() {
  return <PlaceholderScreen title="Search" />;
}
function AddScreen() {
  return <PlaceholderScreen title="Add" />;
}
function MessagesScreen() {
  return <PlaceholderScreen title="Messages" />;
}

const ICONS: Record<keyof RootTabParamList, string> = {
  Home: "🏠",
  Search: "🔍",
  Add: "+",
  Messages: "💬",
  ProfileTab: "👤",
};

export function RootTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarIcon: () =>
          route.name === "Add" ? (
            <View style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>
          ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Add" component={AddScreen} options={{ tabBarLabel: () => null }} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.backgroundElevated,
    borderTopColor: theme.colors.surfaceBorder,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
});
