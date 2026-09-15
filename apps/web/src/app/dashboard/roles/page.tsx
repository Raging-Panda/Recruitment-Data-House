import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGithubAccessToken } from "@/lib/github-connection";
import { loadDeveloperHubData } from "@/lib/developer-data";
import { listJobRoles, computeRoleMatch } from "@/lib/job-roles";
import { EmptyState } from "@/components/empty-state";
import { BriefcaseIcon } from "@/components/icons";

export default async function RolesPage() {
  const session = await getServerSession(authOptions);
  const githubToken = await getGithubAccessToken(session);
  const roles = await listJobRoles().catch(() => []);

  let fingerprint = null;
  if (githubToken) {
    try {
      fingerprint = (await loadDeveloperHubData(githubToken, session!.githubId!)).skillFingerprint;
    } catch {
      fingerprint = null;
    }
  }

  const scored = roles
    .map((role) => ({ role, match: fingerprint ? computeRoleMatch(fingerprint, role.requiredSkills) : null }))
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-heading">Open Roles</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Client roles matched against your skill fingerprint — one input alongside real screening,
        not a replacement for it.
      </p>

      {scored.length === 0 ? (
        <EmptyState className="mt-6" icon={BriefcaseIcon} title="No open roles yet" description="Check back soon." />
      ) : (
        <ul className="mt-6 space-y-3">
          {scored.map(({ role, match }) => (
            <li key={role.id} className="rounded-2xl border border-surface-border bg-background-elevated p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-heading">{role.title}</p>
                  <p className="text-xs text-text-secondary">
                    {role.company}
                    {role.location ? ` · ${role.location}` : ""}
                  </p>
                </div>
                {match !== null && (
                  <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                    {match}% match
                  </span>
                )}
              </div>
              {role.description && <p className="mt-2 text-sm text-text-secondary">{role.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
