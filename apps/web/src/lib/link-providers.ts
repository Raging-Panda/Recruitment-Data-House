import "server-only";
import type { LinkProvider } from "./linked-accounts";

export interface LinkProviderProfile {
  id: string;
  login: string | null;
  avatarUrl: string | null;
}

interface LinkProviderConfig {
  /** Env var names this provider's client id/secret come from. */
  clientIdEnv: string;
  clientSecretEnv: string;
  authorizeUrl(params: { clientId: string; redirectUri: string; state: string }): string;
  exchangeCode(params: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
  }): Promise<string>;
  fetchProfile(accessToken: string): Promise<LinkProviderProfile>;
}

/**
 * One hand-rolled OAuth 2 client per provider, entirely separate from both
 * NextAuth's providers (lib/auth.ts) and each other — this file exists
 * because NextAuth v4's JWT-strategy sessions have no supported way to run
 * an OAuth round trip that attaches to the *current* session instead of
 * starting a new one (that needs a database Adapter, which this app
 * deliberately doesn't use). See app/api/link/start/[provider]/route.ts
 * for the full reasoning and app/api/link/callback/[provider]/route.ts for
 * where these get used.
 *
 * GitHub needs its *own* OAuth App (a third one, alongside the primary
 * web app and the mobile app) — GitHub OAuth Apps allow exactly one
 * callback URL each, already spoken for by /api/auth/callback/github, so
 * this flow's distinct /api/link/callback/github needs a distinct app.
 * Google and LinkedIn both allow multiple redirect URIs per client, so
 * those two reuse the primary sign-in app/client's id and secret — only a
 * new authorized redirect URI needs adding on each, not a whole new app.
 */
export const LINK_PROVIDERS: Record<LinkProvider, LinkProviderConfig> = {
  github: {
    clientIdEnv: "GITHUB_LINK_CLIENT_ID",
    clientSecretEnv: "GITHUB_LINK_CLIENT_SECRET",
    authorizeUrl: ({ clientId, redirectUri, state }) =>
      `https://github.com/login/oauth/authorize?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "read:user user:email repo",
        state,
      })}`,
    async exchangeCode({ clientId, clientSecret, code, redirectUri }) {
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.access_token) {
        throw new Error(json.error_description ?? json.error ?? "GitHub token exchange failed");
      }
      return json.access_token as string;
    },
    async fetchProfile(accessToken) {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error("Could not read GitHub profile");
      const json = await res.json();
      return { id: String(json.id), login: json.login ?? null, avatarUrl: json.avatar_url ?? null };
    },
  },
  google: {
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    authorizeUrl: ({ clientId, redirectUri, state }) =>
      `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "online",
        state,
      })}`,
    async exchangeCode({ clientId, clientSecret, code, redirectUri }) {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.access_token) {
        throw new Error(json.error_description ?? json.error ?? "Google token exchange failed");
      }
      return json.access_token as string;
    },
    async fetchProfile(accessToken) {
      const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Could not read Google profile");
      const json = await res.json();
      return { id: String(json.sub), login: json.email ?? json.name ?? null, avatarUrl: json.picture ?? null };
    },
  },
  linkedin: {
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    authorizeUrl: ({ clientId, redirectUri, state }) =>
      `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "openid profile email",
        state,
      })}`,
    async exchangeCode({ clientId, clientSecret, code, redirectUri }) {
      // Posting client_id/client_secret as form fields (not HTTP Basic
      // Auth) — LinkedIn's token endpoint requires client_secret_post;
      // see the LinkedInProvider comment in lib/auth.ts for how that was
      // found the hard way against a real app.
      const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.access_token) {
        throw new Error(json.error_description ?? json.error ?? "LinkedIn token exchange failed");
      }
      return json.access_token as string;
    },
    async fetchProfile(accessToken) {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Could not read LinkedIn profile");
      const json = await res.json();
      return { id: String(json.sub), login: json.name ?? json.email ?? null, avatarUrl: json.picture ?? null };
    },
  },
};

export function getLinkProviderCredentials(provider: LinkProvider): { clientId: string; clientSecret: string } {
  const config = LINK_PROVIDERS[provider];
  return {
    clientId: process.env[config.clientIdEnv] ?? "",
    clientSecret: process.env[config.clientSecretEnv] ?? "",
  };
}
