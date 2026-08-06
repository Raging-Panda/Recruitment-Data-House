import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { IPSkillLogo } from "@/components/IPSkillLogo";
import { ArrowRightIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/theme";

export function LoginScreen() {
  const { signInWithGithub, isLoading } = useAuth();

  return (
    <View style={styles.container}>
      <IPSkillLogo size={140} />
      <Text style={styles.title}>IPSkill</Text>
      <Text style={styles.tagline}>UNIQUE SKILLS. PERFECT MATCH.</Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryButton} onPress={signInWithGithub}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <ArrowRightIcon size={16} color={theme.colors.white} />
        </TouchableOpacity>

        <View style={[styles.secondaryButton, styles.disabled]}>
          <Text style={styles.secondaryButtonTextDisabled}>Continue with Google</Text>
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={signInWithGithub}>
          {isLoading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.secondaryButtonText}>Continue with GitHub</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostButton} onPress={signInWithGithub}>
          <Text style={styles.ghostButtonText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.white,
  },
  tagline: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: 1.5,
    color: theme.colors.textSecondary,
  },
  buttons: {
    marginTop: 40,
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  secondaryButtonTextDisabled: {
    color: "#999",
    fontWeight: "700",
    fontSize: 14,
  },
  ghostButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  ghostButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
});
