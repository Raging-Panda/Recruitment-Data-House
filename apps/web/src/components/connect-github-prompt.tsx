import { EmptyState } from "@/components/empty-state";
import { CodeIcon } from "@/components/icons";

/**
 * Rendered in place of a GitHub-derived dashboard page (Profile's
 * fingerprint section, Skills, Projects, Analytics) for an account with no
 * GitHub connection — currently that's Google sign-ins only. Explicitly
 * honest that this isn't account linking yet: signing in with GitHub here
 * starts a second, separate identity rather than upgrading this one.
 */
export function ConnectGithubPrompt({ page }: { page: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-heading">{page}</h1>
      <EmptyState
        className="mt-6"
        icon={CodeIcon}
        title="Connect GitHub to unlock this"
        description={`${page} is built from your GitHub activity — commits, repos, languages, PRs. Sign in with GitHub to generate it. Heads up: since account linking isn't built yet, that starts a separate IPSkill profile rather than adding GitHub to this one — your About, experience, and certifications here won't carry over.`}
        action={
          <a
            href="/api/auth/signin/github"
            className="inline-flex items-center justify-center rounded-full bg-primary-gradient px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Sign in with GitHub
          </a>
        }
      />
    </div>
  );
}
