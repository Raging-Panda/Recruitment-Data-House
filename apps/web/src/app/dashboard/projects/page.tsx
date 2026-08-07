import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadDeveloperHubData, loadProjectActivityTimeline } from "@/lib/developer-data";
import { ActivityTimeline } from "@/components/activity-timeline";
import { StarIcon, EyeIcon, BriefcaseIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  const [{ projects }, timeline] = await Promise.all([
    loadDeveloperHubData(session!.accessToken!),
    loadProjectActivityTimeline(session!.accessToken!),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-heading">Projects</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Your non-fork GitHub repositories, most recently updated first.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {projects.map((project) => (
          <a
            key={project.id}
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col gap-3 rounded-xl border border-surface-border bg-background-elevated p-4 transition hover:border-primary sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-heading">{project.name}</h3>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase text-text-secondary">
                  {project.category}
                </span>
              </div>
              <p className="text-sm text-text-secondary">
                {project.languages.join(", ") || "No language data"}
              </p>
              {project.description && (
                <p className="mt-1 text-xs text-text-muted">{project.description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <StarIcon size={14} /> {project.stars}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon size={14} /> {project.watchers}
              </span>
              <span className="text-xs text-text-muted">
                {new Date(project.updatedAt).getFullYear()}
              </span>
            </div>
          </a>
        ))}
        {projects.length === 0 && (
          <EmptyState
            icon={BriefcaseIcon}
            title="No projects yet"
            description="Push a commit to a public GitHub repo and it'll show up here automatically."
          />
        )}
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
