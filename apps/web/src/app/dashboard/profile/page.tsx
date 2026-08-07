import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { loadDeveloperHubData } from "@/lib/developer-data";
import { getCandidateProfileOverrideSafe } from "@/lib/candidate-profile";
import { getOnboardingChecklist } from "@/lib/onboarding";
import { InfoCard } from "@/components/info-card";
import { ScoreRing } from "@/components/score-ring";
import { DisplayNameEditor } from "@/components/display-name-editor";
import { OnboardingChecklist } from "@/components/onboarding-checklist";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const [{ profile, activity }, override] = await Promise.all([
    loadDeveloperHubData(session!.accessToken!),
    getCandidateProfileOverrideSafe(session!.githubId!),
  ]);
  const displayName = override?.displayName ?? profile.name;
  const checklist = await getOnboardingChecklist(session!.githubId!, profile, Boolean(override));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-heading">My Profile</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Your developer profile, sourced live from GitHub.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-surface-border bg-background-elevated p-6 md:grid-cols-[auto_1fr_auto]">
        <Image
          src={profile.avatarUrl}
          alt={displayName}
          width={88}
          height={88}
          className="rounded-full"
        />
        <div>
          <DisplayNameEditor initialName={displayName} />
          <p className="text-sm text-text-secondary">{profile.headline}</p>
          {profile.location && (
            <p className="mt-1 text-xs text-text-muted">📍 {profile.location}</p>
          )}
          <p className="mt-3 max-w-md text-sm text-text-secondary">
            {profile.about ?? "No bio provided on GitHub yet."}
          </p>
          <p className="mt-3 text-xs text-text-muted">@{profile.githubLogin}</p>
        </div>
        <ScoreRing score={checklist.percentage} label="Profile Completion" />
      </div>

      <OnboardingChecklist items={checklist.items} percentage={checklist.percentage} />

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <InfoCard title="Personal Information">
          <Row label="Full Name" value={displayName} />
          <Row label="Location" value={profile.location ?? "Not set on GitHub"} />
        </InfoCard>

        <InfoCard title="Professional Information">
          <Row label="Headline" value={profile.headline} />
          <Row label="Public Repos" value={String(activity.publicRepoCount)} />
          <Row label="Followers" value={String(activity.followers)} />
          <Row
            label="Availability"
            value={profile.availableForOpportunities ? "Open to Opportunities" : "Not available"}
          />
        </InfoCard>

        <InfoCard title="Account Security">
          <Row label="Auth Method" value="GitHub OAuth" />
          <Row label="Account Status" value="Verified via GitHub ✓" />
        </InfoCard>

        <InfoCard title="Social Profiles">
          <Row label="GitHub" value={`github.com/${profile.githubLogin}`} />
        </InfoCard>

        <InfoCard title="Resume/CV">
          <p className="text-sm text-text-muted">
            Resume upload isn&apos;t wired up yet — coming in a later milestone.
          </p>
        </InfoCard>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-heading">{value}</span>
    </div>
  );
}
