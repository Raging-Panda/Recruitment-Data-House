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
import { TwoFactorCard } from "@/components/two-factor-card";
import { getTotpStatus } from "@/lib/two-factor";

function primaryProviderOf(session: { accessToken?: string; githubId?: string }): LinkProvider | "local" {
  if (session.accessToken) return "github";
  if (session.githubId?.startsWith("google:")) return "google";
  if (session.githubId?.startsWith("linkedin:")) return "linkedin";
  return "local";
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const isDemo = isDemoAccount(session!.githubId);
  const primaryProvider = primaryProviderOf(session!);
  const [linked, messagePreference, totpStatus] = await Promise.all([
    getLinkedAccountsSafe(session!.githubId!),
    getMessagePreference(session!.githubId!),
    getTotpStatus(session!.githubId!),
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
          primaryProvider={primaryProvider}
          initialLinked={linked}
          isDemo={isDemo}
          testLinkAvailable={isTestModeEnabled()}
        />
        {totpStatus.supported ? (
          <TwoFactorCard initiallyEnabled={totpStatus.enabled} isDemo={isDemo} />
        ) : (
          <div className="rounded-2xl border border-surface-border bg-background-elevated p-5">
            <h3 className="text-sm font-semibold text-heading">Two-Factor Authentication</h3>
            <p className="mt-1 text-xs text-text-muted">
              Handled by {primaryProvider === "github" ? "GitHub" : primaryProvider === "google" ? "Google" : "LinkedIn"}
              's own sign-in — enable it there. IPSkill's own 2FA only applies to email/password
              accounts.
            </p>
          </div>
        )}
        <DirectMessagesCard initialPreference={messagePreference} isDemo={isDemo} />
        <ReferralCard />
        <ApiKeysCard isDemo={isDemo} />
      </div>
    </div>
  );
}
