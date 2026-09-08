import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { LoginScreen } from "@/screens/LoginScreen";
import { RootTabNavigator } from "@/navigation/RootTabNavigator";
import { BrandedLoadingScreen } from "@/components/BrandedLoadingScreen";

function RootNavigation() {
  const { accessToken, isLoading } = useAuth();
  const { mode } = useTheme();

  // Without this, a returning signed-in user briefly flashes the login
  // screen every cold start — accessToken starts null until the stored
  // token finishes loading from SecureStore, and this used to fall
  // straight through to the accessToken check below.
  if (isLoading) {
    return <BrandedLoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {accessToken ? <RootTabNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </ThemeProvider>
  );
}
