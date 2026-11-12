import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { needsConsent } from "@/lib/consent";
import { ConsentCard } from "@/components/consent-card";
import { DeleteAccountCard } from "@/components/delete-account-card";
import { FingerprintPattern } from "@/components/fingerprint-pattern";
import { PublicFooter } from "@/components/public-chrome";

export const metadata = {
  title: "Your consent — IPSkill",
};

/** Where the dashboard layout sends a signed-in account with no POPIA
 * consent on record. Deliberately outside /dashboard, whose layout is the
 * gate. Offers account deletion too, so someone who won't consent can
 * still have their information removed without emailing us. */
export default async function ConsentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.githubId) redirect("/login");
  if (!(await needsConsent(session.githubId))) redirect("/dashboard/profile");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
        <FingerprintPattern />
        <div className="relative w-full max-w-md space-y-6">
          <ConsentCard />
          <DeleteAccountCard isDemo={false} />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
