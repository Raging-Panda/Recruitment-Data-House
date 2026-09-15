import type { NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  isTestModeEnabled,
  TEST_ACCESS_TOKEN,
  TEST_GITHUB_ID,
  TEST_GOOGLE_ID,
  TEST_LINKEDIN_ID,
} from "./test-mode";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_ACCESS_TOKEN, DEMO_GITHUB_ID } from "./demo-mode";
import { DEMO_DISPLAY_NAME } from "./demo-data";
import { getSupabaseAdmin } from "./supabase";
import { verifyPassword } from "./password";
import { LOCAL_ID_PREFIX } from "./local-account";

interface LinkedInOIDCProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

/**
 * Hand-rolled rather than next-auth/providers/linkedin — that built-in
 * provider (still shipped as of next-auth 4.24.x) calls LinkedIn's legacy
 * /v2/me + a separate /v2/emailAddress endpoint, which need the
 * r_liteprofile/r_emailaddress product. LinkedIn stopped granting that
 * product to new apps years ago; every app created today only gets "Sign
 * In with LinkedIn using OpenID Connect", which serves the profile from
 * the standard OIDC /v2/userinfo endpoint instead — a single call, a
 * flat {sub, name, email, picture} shape, no legacy scopes. Using the
 * package's provider as-is would 403 on the first real login.
 */
function LinkedInProvider(options: {
  clientId: string;
  clientSecret: string;
}): OAuthConfig<LinkedInOIDCProfile> {
  return {
    id: "linkedin",
    name: "LinkedIn",
    type: "oauth",
    authorization: {
      url: "https://www.linkedin.com/oauth/v2/authorization",
      params: { scope: "openid profile email" },
    },
    token: "https://www.linkedin.com/oauth/v2/accessToken",
    userinfo: "https://api.linkedin.com/v2/userinfo",
    checks: ["state"],
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    profile(profile: LinkedInOIDCProfile) {
      return {
        id: profile.sub,
        name: profile.name ?? null,
        email: profile.email ?? null,
        image: profile.picture ?? null,
      };
    },
  };
}

const providers: NextAuthOptions["providers"] = [
  GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    authorization: {
      params: {
        scope: "read:user user:email repo",
      },
    },
  }),
  // For candidates without a GitHub-first workflow. Deliberately a second-
  // class citizen next to GitHub: IPSkill's core value (skill fingerprint,
  // contribution heatmap, project list) is computed from the GitHub API
  // using the GitHub OAuth token, which a Google sign-in has no equivalent
  // of. A Google-only account gets the manually-entered parts of a profile
  // (About/Currently, experience, certifications, skill tests) and sees a
  // "Connect GitHub" prompt in place of every GitHub-derived page — see
  // lib/github-connection.ts. There is no account linking yet: signing in
  // with GitHub afterwards starts a separate identity rather than upgrading
  // this one (see the "Google login" item in improvements.md).
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  }),
  // Same second-class-citizen status as Google — no GitHub token, so
  // ThinProfile / ConnectGithubPrompt again. See the LinkedInProvider
  // comment above for why this isn't next-auth's built-in provider.
  LinkedInProvider({
    clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
  }),
  // Real email/password accounts (users table, apps/web/src/lib/password.ts
  // for hashing). Same "second-class citizen" status as Google — a regular
  // account has no GitHub token and gets the ThinProfile / ConnectGithubPrompt
  // treatment (lib/github-connection.ts) until account linking exists.
  // Registration is a separate step: POST /api/auth/register, then the
  // client calls signIn("credentials", ...) itself.
  CredentialsProvider({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      if (!email || !credentials?.password) return null;

      const { data: user, error } = await getSupabaseAdmin()
        .from("users")
        .select("id, email, password_hash, display_name")
        .eq("email", email)
        .maybeSingle();
      if (error || !user) return null;
      if (!verifyPassword(credentials.password, user.password_hash)) return null;

      return {
        id: `${LOCAL_ID_PREFIX}${user.id}`,
        name: user.display_name ?? user.email,
        email: user.email,
        image: null,
      };
    },
  }),
  // Public, always-on proof-of-concept login — a fully populated fixture
  // profile anyone evaluating the product can see without a real GitHub
  // account. Deliberately not gated behind ALLOW_TEST_LOGIN like the dev
  // bypass below, since this is meant to be used by prospects, not just us.
  CredentialsProvider({
    id: "demo-account",
    name: "Demo Account",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (credentials?.email === DEMO_EMAIL && credentials?.password === DEMO_PASSWORD) {
        return {
          id: DEMO_GITHUB_ID,
          name: DEMO_DISPLAY_NAME,
          email: DEMO_EMAIL,
          image: "https://i.pravatar.cc/300?img=47",
        };
      }
      return null;
    },
  }),
];

// Dev-only bypass so the app can be exercised without a real GitHub OAuth
// round trip — see test-mode.ts for the ALLOW_TEST_LOGIN gate. Never
// registered unless that env var is explicitly set, so it can't appear
// (or be signed into) on a deployment where it wasn't deliberately enabled.
if (isTestModeEnabled()) {
  providers.push(
    CredentialsProvider({
      id: "test-account",
      name: "Test Account",
      credentials: {},
      async authorize() {
        return {
          id: TEST_GITHUB_ID,
          name: "Test Developer",
          email: "test-developer@ipskill.dev",
          image: "https://avatars.githubusercontent.com/u/9919?s=200&v=4",
        };
      },
    })
  );
  // Simulates a real Google sign-in — no GitHub token, "google:"-prefixed
  // id — without needing a real Google OAuth app in dev. Exercises the
  // ThinProfile / ConnectGithubPrompt paths (see lib/github-connection.ts).
  providers.push(
    CredentialsProvider({
      id: "test-google-account",
      name: "Test Google Account",
      credentials: {},
      async authorize() {
        return {
          id: TEST_GOOGLE_ID,
          name: "Test Google User",
          email: "test-google-user@gmail.com",
          image: "https://i.pravatar.cc/300?img=68",
        };
      },
    })
  );
  // Simulates a real LinkedIn sign-in — same idea as test-google-account.
  providers.push(
    CredentialsProvider({
      id: "test-linkedin-account",
      name: "Test LinkedIn Account",
      credentials: {},
      async authorize() {
        return {
          id: TEST_LINKEDIN_ID,
          name: "Test LinkedIn User",
          email: "test-linkedin-user@ipskill.dev",
          image: "https://i.pravatar.cc/300?img=15",
        };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === "credentials" && user) {
        // No accessToken — same as Google, this is a no-GitHub-connection
        // identity until account linking exists. user.id is already
        // "local:<users.id>", set by the authorize() callback above.
        token.githubId = user.id;
      }
      if (account?.provider === "github" && account.access_token) {
        token.accessToken = account.access_token;
        // GitHub's numeric account ID — stable even if the user renames
        // their GitHub username, unlike the login string.
        token.githubId = account.providerAccountId;
      }
      if (account?.provider === "google") {
        // Deliberately NOT storing Google's access_token as token.accessToken
        // — every GitHub-derived page passes that field straight to the
        // GitHub API, and a Google token there would either 401 or (far
        // worse) silently authenticate as whoever else's GitHub app it
        // happens to resemble. Leaving it unset is what
        // hasGithubConnection() keys off of. The "google:" prefix keeps
        // this id from ever colliding with a real numeric GitHub id in the
        // same github_id column.
        token.githubId = `google:${account.providerAccountId}`;
      }
      if (account?.provider === "test-account") {
        token.accessToken = TEST_ACCESS_TOKEN;
        token.githubId = TEST_GITHUB_ID;
      }
      if (account?.provider === "linkedin") {
        // No accessToken — same reasoning as the Google branch above.
        token.githubId = `linkedin:${account.providerAccountId}`;
      }
      if (account?.provider === "test-google-account") {
        // No accessToken, same as the real Google branch above.
        token.githubId = TEST_GOOGLE_ID;
      }
      if (account?.provider === "test-linkedin-account") {
        token.githubId = TEST_LINKEDIN_ID;
      }
      if (account?.provider === "demo-account") {
        token.accessToken = DEMO_ACCESS_TOKEN;
        token.githubId = DEMO_GITHUB_ID;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.githubId = token.githubId as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
