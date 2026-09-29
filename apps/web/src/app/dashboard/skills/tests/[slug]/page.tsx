import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToTemplate, type TemplateRow } from "@/lib/skill-tests";
import { TakeTest } from "@/components/take-test";
import { V1_MODE } from "@/lib/v1-mode";

export default async function TakeTestPage({ params }: { params: { slug: string } }) {
  if (V1_MODE) notFound();
  const { data: templateRow } = await getSupabaseAdmin()
    .from("skill_test_templates")
    .select("*, skill_test_questions(count)")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!templateRow) {
    notFound();
  }

  const template = rowToTemplate(templateRow as TemplateRow);

  return (
    <div className="mx-auto max-w-2xl">
      <TakeTest template={template} />
    </div>
  );
}
