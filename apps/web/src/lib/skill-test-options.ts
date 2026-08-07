import { getSupabaseAdmin } from "@/lib/supabase";

export interface SkillTestOption {
  stack: string;
  isAvailable: boolean;
  templateSlug: string | null;
  templateTitle: string | null;
}

interface OptionRow {
  slug: string;
  title: string;
  stack: string;
  is_active: boolean;
}

/**
 * One entry per distinct stack across the whole skill_test_templates table
 * (active and inactive) — reference data, not user-specific, so unlike
 * everything else in the app this is read the same way for every account
 * including demo, same as the Skills page's own template list. A stack
 * counts as available if it has at least one active template; the 9-tier
 * difficulty scaffold (see the skill-test-levels migration) means most
 * stacks currently have none, which is surfaced honestly as "coming soon"
 * rather than hidden.
 */
export async function getSkillTestOptions(): Promise<SkillTestOption[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("skill_test_templates")
    .select("slug, title, stack, is_active");

  if (error) throw new Error(error.message);

  const byStack = new Map<string, OptionRow[]>();
  for (const row of (data ?? []) as OptionRow[]) {
    const list = byStack.get(row.stack) ?? [];
    list.push(row);
    byStack.set(row.stack, list);
  }

  return [...byStack.entries()]
    .map(([stack, templates]) => {
      const active = templates.find((t) => t.is_active) ?? null;
      return {
        stack,
        isAvailable: Boolean(active),
        templateSlug: active?.slug ?? null,
        templateTitle: active?.title ?? null,
      };
    })
    .sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return a.stack.localeCompare(b.stack);
    });
}
