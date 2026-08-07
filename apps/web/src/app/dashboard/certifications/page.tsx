import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToCertification } from "@/lib/certifications";
import { CertificationsManager } from "@/components/certifications-manager";
import { isDemoAccount } from "@/lib/demo-mode";
import { DEMO_CERTIFICATIONS } from "@/lib/demo-data";

export default async function CertificationsPage() {
  const session = await getServerSession(authOptions);

  let entries;
  if (isDemoAccount(session!.githubId)) {
    entries = DEMO_CERTIFICATIONS;
  } else {
    const { data, error } = await getSupabaseAdmin()
      .from("certifications")
      .select("*")
      .eq("github_id", session!.githubId!)
      .order("issue_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to load certifications: ${error.message}`);
    }
    entries = data.map(rowToCertification);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-heading">Certifications</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Credentials and certifications — entered manually, same as work history.
      </p>

      <CertificationsManager initialEntries={entries} />
    </div>
  );
}
