import type { SkillProof } from "@/lib/skill-proofs";

export function SkillProofsList({ proofs }: { proofs: SkillProof[] }) {
  if (proofs.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {proofs.map((proof) => (
        <li key={proof.id} className="flex items-center gap-2 text-sm">
          <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-secondary">
            {proof.skillCategory}
          </span>
          <a href={proof.url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
            {proof.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
