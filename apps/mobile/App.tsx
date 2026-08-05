import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LoginScreen } from "@/screens/LoginScreen";
import { RootTabNavigator } from "@/navigation/RootTabNavigator";

function RootNavigation() {
  const { accessToken } = useAuth();
  return (
    <NavigationContainer>
      {accessToken ? <RootTabNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigation />
    </AuthProvider>
  );
}
