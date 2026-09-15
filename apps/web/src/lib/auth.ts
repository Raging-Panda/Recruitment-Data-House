import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { isTestModeEnabled, TEST_ACCESS_TOKEN, TEST_GITHUB_ID, TEST_GOOGLE_ID } from "./test-mode";
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
      if (account?.provider === "test-google-account") {
        // No accessToken, same as the real Google branch above.
        token.githubId = TEST_GOOGLE_ID;
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
