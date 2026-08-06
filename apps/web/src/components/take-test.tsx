"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SkillTestQuestion, SkillTestSubmitResult, SkillTestTemplate } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";

type Phase = "loading" | "in_progress" | "submitting" | "result" | "error";

function formatClock(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TakeTest({ template }: { template: SkillTestTemplate }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SkillTestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<SkillTestSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const attemptIdRef = useRef<string | null>(null);

  const submit = useCallback(async () => {
    if (!attemptIdRef.current) return;
    setPhase("submitting");
    try {
      const res = await fetch(`/api/skill-tests/attempts/${attemptIdRef.current}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/skill-tests/${template.id}/start`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to start test");

        attemptIdRef.current = data.attemptId;
        setAttemptId(data.attemptId);
        setQuestions(data.questions);

        const elapsed = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000);
        setSecondsLeft(Math.max(0, data.timeLimitSeconds - elapsed));
        setPhase("in_progress");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start test");
        setPhase("error");
      }
    })();
  }, [template.id]);

  useEffect(() => {
    if (phase !== "in_progress") return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, submit]);

  if (phase === "loading") {
    return <p className="text-sm text-text-secondary">Loading test…</p>;
  }

  if (phase === "error") {
    return (
      <div>
        <p className="text-sm text-accent-red">{error}</p>
        <Link href="/dashboard/skills" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to Skills
        </Link>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="rounded-2xl border border-surface-border bg-background-elevated p-8 text-center">
        <p className="text-sm text-text-secondary">{template.title}</p>
        <p className="mt-2 text-4xl font-bold text-heading">{result.percentage}%</p>
        <p className="mt-1 text-sm text-text-secondary">
          {result.score} / {result.maxScore} correct
          {result.status === "expired" ? " · submitted after time ran out" : ""}
        </p>
        <Link href="/dashboard/skills" className={buttonClass("primary", "md", "mt-6")}>
          Back to Skills
        </Link>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">{template.title}</h1>
        <span
          className={`font-mono text-sm ${secondsLeft <= 30 ? "text-accent-red" : "text-text-secondary"}`}
        >
          {formatClock(secondsLeft)}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {answeredCount} / {questions.length} answered
      </p>

      <div className="mt-6 flex flex-col gap-5">
        {questions.map((q, i) => (
          <fieldset
            key={q.id}
            className="rounded-2xl border border-surface-border bg-background-elevated p-5"
          >
            <legend className="px-1 text-sm font-medium text-heading">
              {i + 1}. {q.questionText}
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              {q.choices.map((choice, choiceIndex) => (
                <label
                  key={choiceIndex}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent p-2 text-sm text-text-secondary hover:border-surface-border"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === choiceIndex}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: choiceIndex }))}
                  />
                  {choice}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={phase !== "in_progress"}
        className={buttonClass("primary", "lg", "mt-6 w-full")}
      >
        Submit
      </button>
    </div>
  );
}
