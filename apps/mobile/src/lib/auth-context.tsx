import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { config } from "./config";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = "ipskill_github_access_token";

const discovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
};

interface AuthContextValue {
  accessToken: string | null;
  isLoading: boolean;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const redirectUri = useMemo(() => AuthSession.makeRedirectUri({ scheme: "ipskill" }), []);

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: config.githubClientId,
      scopes: ["read:user", "user:email", "repo"],
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then(setAccessToken)
      .finally(() => setIsLoading(false));
  }, []);

  const signInWithGithub = useCallback(async () => {
    if (!request) return;
    const result = await promptAsync();
    if (result.type !== "success" || !result.params.code) return;

    const exchangeRes = await fetch(`${config.authBackendUrl}/api/mobile/github-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: result.params.code, redirectUri }),
    });
    const data = await exchangeRes.json();
    if (data.accessToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
      setAccessToken(data.accessToken);
    }
  }, [request, promptAsync, redirectUri]);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, isLoading, signInWithGithub, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
