import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadDeveloperHubData, loadProjectActivityTimeline } from "@/lib/developer-data";
import { getGithubAccessToken } from "@/lib/github-connection";
import { ConnectGithubPrompt } from "@/components/connect-github-prompt";
import { ActivityTimeline } from "@/components/activity-timeline";
import { ProjectsList } from "@/components/projects-list";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  const githubToken = await getGithubAccessToken(session);
  if (!githubToken) return <ConnectGithubPrompt page="Projects" />;

  const [{ projects }, timeline] = await Promise.all([
    loadDeveloperHubData(githubToken, session!.githubId!),
    loadProjectActivityTimeline(githubToken, session!.githubId!),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-heading">Projects</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Your non-fork GitHub repositories, most recently updated first.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <ProjectsList projects={projects} />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-heading">Recent Activity</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Commits, PRs, and releases across your most active repos — trajectory, not just a
          snapshot.
        </p>
        <ActivityTimeline events={timeline} />
      </div>
    </div>
  );
}
