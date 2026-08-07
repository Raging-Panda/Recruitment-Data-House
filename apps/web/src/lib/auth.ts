import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { isTestModeEnabled, TEST_ACCESS_TOKEN, TEST_GITHUB_ID } from "./test-mode";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_ACCESS_TOKEN, DEMO_GITHUB_ID } from "./demo-mode";
import { DEMO_DISPLAY_NAME } from "./demo-data";

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
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "github" && account.access_token) {
        token.accessToken = account.access_token;
        // GitHub's numeric account ID — stable even if the user renames
        // their GitHub username, unlike the login string.
        token.githubId = account.providerAccountId;
      }
      if (account?.provider === "test-account") {
        token.accessToken = TEST_ACCESS_TOKEN;
        token.githubId = TEST_GITHUB_ID;
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
