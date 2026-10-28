import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginCard } from "@/components/login-card";
import { FingerprintPattern } from "@/components/fingerprint-pattern";
import { PublicFooter } from "@/components/public-chrome";

export default async function LoginPage() {
  // A signed-in visitor has no reason to see the login form. This matters
  // beyond tidiness: NextAuth sends any failed OAuth callback — including a
  // duplicate one for a flow that already succeeded (same state, second code;
  // seen when a phone completes the GitHub flow twice) — to /login, so
  // without this a user who IS signed in lands on a login screen and
  // reasonably believes the sign-in failed.
  const session = await getServerSession(authOptions);
  if (session?.githubId) redirect("/dashboard/profile");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
        <FingerprintPattern />
        <div className="relative">
          <LoginCard />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
