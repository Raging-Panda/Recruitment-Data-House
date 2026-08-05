import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadDeveloperHubData } from "@/lib/developer-data";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  const { projects } = await loadDeveloperHubData(session!.accessToken!);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-white">Projects</h1>
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
            className="flex items-center justify-between rounded-xl border border-surface-border bg-background-elevated p-4 transition hover:border-primary"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{project.name}</h3>
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
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span>⭐ {project.stars}</span>
              <span>👁 {project.watchers}</span>
              <span className="text-xs text-text-muted">
                {new Date(project.updatedAt).getFullYear()}
              </span>
            </div>
          </a>
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-text-muted">No public repositories found yet.</p>
        )}
      </div>
    </div>
  );
}
