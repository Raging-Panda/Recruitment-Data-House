import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PlaceholderScreen } from "@/screens/PlaceholderScreen";
import { ProfileStackNavigator } from "./ProfileStackNavigator";
import { useTheme, type ThemeColors } from "@/lib/theme-context";
import { HomeIcon, SearchIcon, MessageIcon, PersonIcon } from "@/components/icons";
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

const ICONS: Record<keyof RootTabParamList, typeof HomeIcon> = {
  Home: HomeIcon,
  Search: SearchIcon,
  Add: HomeIcon,
  Messages: MessageIcon,
  ProfileTab: PersonIcon,
};

export function RootTabNavigator() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color }) => {
          if (route.name === "Add") {
            return (
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </View>
            );
          }
          const Icon = ICONS[route.name];
          return <Icon size={20} color={color} />;
        },
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.backgroundElevated,
      borderTopColor: colors.surfaceBorder,
      height: 64,
      paddingBottom: 8,
      paddingTop: 8,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -20,
    },
    addButtonText: {
      color: colors.white,
      fontSize: 22,
      fontWeight: "700",
    },
  });
}
