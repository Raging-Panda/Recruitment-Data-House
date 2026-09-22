import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoAccount } from "@/lib/demo-mode";
import { listInterviewsFor } from "@/lib/interviews";
import { getDirectoryEntriesByIds } from "@/lib/directory";
import { EmptyState } from "@/components/empty-state";
import { CalendarIcon } from "@/components/icons";
import { InterviewCard } from "@/components/interview-card";

export default async function InterviewsPage() {
  const session = await getServerSession(authOptions);
  const isDemo = isDemoAccount(session!.githubId);
  const interviews = isDemo ? [] : await listInterviewsFor(session!.githubId!).catch(() => []);

  const otherIds = interviews.map((i) => (i.candidateId === session!.githubId ? i.recruiterId : i.candidateId));
  const others = await getDirectoryEntriesByIds([...new Set(otherIds)]).catch(() => []);
  const otherMap = new Map(others.map((o) => [o.githubId, o.displayName]));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-heading">Interviews</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Screening calls proposed from a Directory profile — pick a time, or see what you've sent.
        Booking generates a one-click calendar link; no calendar account connection needed.
      </p>

      {isDemo || interviews.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={CalendarIcon}
          title="No interviews yet"
          description={
            isDemo
              ? "Interview scheduling isn't available on the shared demo account."
              : "A recruiter proposes times from your Directory profile — they'll show up here."
          }
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {interviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              viewerId={session!.githubId!}
              otherName={
                otherMap.get(interview.candidateId === session!.githubId ? interview.recruiterId : interview.candidateId) ??
                "them"
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
