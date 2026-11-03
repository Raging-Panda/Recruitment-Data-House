import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import { AdminProfileRow } from "@/components/admin-profile-row";
import { AdminPlanForm } from "@/components/admin-plan-form";
import { PLAN_LABELS, type Plan } from "@/lib/plan";

export const dynamic = "force-dynamic";

interface ProfileRow {
  github_id: string;
  github_login: string;
  display_name: string;
  handle: string | null;
  visibility: string | null;
  overall_score: number;
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  // 404 rather than 403 so the route's existence isn't advertised.
  if (!isAdmin(session?.githubId)) notFound();

  const supabase = getSupabaseAdmin();
  const [{ data: profiles }, { data: moderation }, { data: paidAccounts }] = await Promise.all([
    supabase
      .from("directory_profiles")
      .select("github_id, github_login, display_name, handle, visibility, overall_score")
      .order("display_name"),
    supabase.from("profile_verifications").select("github_id, admin_verified, hidden"),
    supabase
      .from("candidate_profile")
      .select("github_id, display_name, plan")
      .neq("plan", "free")
      .order("updated_at", { ascending: false }),
  ]);
  const modById = new Map(
    (moderation ?? []).map((m: { github_id: string; admin_verified: boolean; hidden: boolean }) => [m.github_id, m])
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-heading">Admin</h1>

      <section className="mt-6 rounded-2xl border border-surface-border bg-background-elevated p-5">
        <h2 className="text-sm font-semibold text-heading">Plans</h2>
        <p className="mt-1 text-xs text-text-secondary">
          Paid plans are granted here until billing exists. People request access with the account
          ID shown in their Settings; set Free to revoke.
        </p>
        <div className="mt-3">
          <AdminPlanForm />
        </div>
        <ul className="mt-4 flex flex-col gap-1.5 text-sm">
          {((paidAccounts ?? []) as { github_id: string; display_name: string | null; plan: Plan }[]).map((a) => (
            <li key={a.github_id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-heading">
                {a.display_name ?? "—"}{" "}
                <code className="select-all text-xs text-text-muted">{a.github_id}</code>
              </span>
              <span className="text-xs font-medium text-text-secondary">{PLAN_LABELS[a.plan] ?? a.plan}</span>
            </li>
          ))}
          {(paidAccounts ?? []).length === 0 && (
            <li className="text-xs text-text-muted">No accounts on a paid plan yet.</li>
          )}
        </ul>
      </section>

      <h2 className="mt-8 text-sm font-semibold text-heading">Profiles</h2>
      <p className="mt-1 text-xs text-text-secondary">
        Mark a profile as reviewed, or hide it from the public site (profile page, index, sitemap).
        Both are reversible.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {((profiles ?? []) as ProfileRow[]).map((p) => {
          const m = modById.get(p.github_id);
          return (
            <AdminProfileRow
              key={p.github_id}
              githubId={p.github_id}
              name={p.display_name}
              login={p.github_login}
              handle={p.handle}
              isPublic={p.visibility === "public"}
              initialVerified={m?.admin_verified ?? false}
              initialHidden={m?.hidden ?? false}
            />
          );
        })}
        {(profiles ?? []).length === 0 && <p className="text-sm text-text-muted">No profiles yet.</p>}
      </div>
    </div>
  );
}
