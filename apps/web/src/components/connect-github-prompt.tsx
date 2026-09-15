import { EmptyState } from "@/components/empty-state";
import { CodeIcon } from "@/components/icons";

/**
 * Rendered in place of a GitHub-derived dashboard page (Profile's
 * fingerprint section, Skills, Projects, Analytics) for an account with no
 * GitHub connection — Google, LinkedIn, and regular (email/password)
 * sign-ins. Links straight to the real account-linking flow
 * (app/api/link/start/github) so GitHub attaches to *this* identity
 * instead of starting a new one — see lib/link-providers.ts.
 */
export function ConnectGithubPrompt({ page }: { page: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-heading">{page}</h1>
      <EmptyState
        className="mt-6"
        icon={CodeIcon}
        title="Connect GitHub to unlock this"
        description={`${page} is built from your GitHub activity — commits, repos, languages, PRs. Connect your GitHub account and it generates here, alongside everything you've already added.`}
        action={
          <div className="flex flex-col items-center gap-2">
            <a
              href="/api/link/start/github"
              className="inline-flex items-center justify-center rounded-full bg-primary-gradient px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Connect GitHub
            </a>
            <a
              href="/api/auth/signin/github"
              className="text-xs text-text-muted underline decoration-dotted hover:text-text-secondary"
            >
              or start a separate GitHub-based profile instead
            </a>
          </div>
        }
      />
    </div>
  );
}
