import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLinkedAccountsSafe, type LinkProvider } from "@/lib/linked-accounts";
import { getMessagePreference } from "@/lib/message-preference";
import { isDemoAccount } from "@/lib/demo-mode";
import { isTestModeEnabled } from "@/lib/test-mode";
import { ConnectedAccountsCard } from "@/components/connected-accounts-card";
import { LinkStatusToast } from "@/components/link-status-toast";
import { ReferralCard } from "@/components/referral-card";
import { ApiKeysCard } from "@/components/api-keys-card";
import { DirectMessagesCard } from "@/components/direct-messages-card";

function primaryProviderOf(session: { accessToken?: string; githubId?: string }): LinkProvider | "local" {
  if (session.accessToken) return "github";
  if (session.githubId?.startsWith("google:")) return "google";
  if (session.githubId?.startsWith("linkedin:")) return "linkedin";
  return "local";
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const isDemo = isDemoAccount(session!.githubId);
  const [linked, messagePreference] = await Promise.all([
    getLinkedAccountsSafe(session!.githubId!),
    getMessagePreference(session!.githubId!),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Suspense fallback={null}>
        <LinkStatusToast />
      </Suspense>
      <h1 className="text-2xl font-bold text-heading">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage how you sign in and what's connected to your profile.
      </p>

      <div className="mt-6 space-y-6">
        <ConnectedAccountsCard
          primaryProvider={primaryProviderOf(session!)}
          initialLinked={linked}
          isDemo={isDemo}
          testLinkAvailable={isTestModeEnabled()}
        />
        <DirectMessagesCard initialPreference={messagePreference} isDemo={isDemo} />
        <ReferralCard />
        <ApiKeysCard isDemo={isDemo} />
      </div>
    </div>
  );
}
