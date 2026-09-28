import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";
import { StarIcon } from "@/components/icons";
import { V1_MODE } from "@/lib/v1-mode";

export default function AchievementsPage() {
  if (V1_MODE) notFound();
  return <ComingSoon title="Achievements" icon={StarIcon} />;
}
