"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SkillTestOption } from "@/lib/skill-test-options";
import { buttonClass } from "@/lib/button-styles";
import { CloseIcon, CheckCircleIcon, ShieldCheckIcon } from "@/components/icons";

export function GetVerifiedSkillButton({ options }: { options: SkillTestOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(option: SkillTestOption) {
    if (!option.isAvailable || !option.templateSlug) return;
    setIsOpen(false);
    router.push(`/dashboard/skills/tests/${option.templateSlug}`);
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={buttonClass("primary", "sm")}>
        <ShieldCheckIcon size={14} />
        Get More Verified Skills
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsOpen(false)} aria-hidden className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-surface-border bg-background-elevated p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-heading">Choose a language or framework</h3>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="text-text-secondary hover:text-heading"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Pick one to take its Verified Skills test — more stacks are on the way.
            </p>

            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col gap-1.5">
                {options.map((option) => (
                  <button
                    key={option.stack}
                    onClick={() => handleSelect(option)}
                    disabled={!option.isAvailable}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      option.isAvailable
                        ? "border-surface-border text-heading hover:border-primary hover:bg-surface"
                        : "cursor-not-allowed border-surface-border/60 text-text-muted"
                    }`}
                  >
                    <span>{option.stack}</span>
                    {option.isAvailable ? (
                      <span className="flex items-center gap-1 text-xs text-accent-green">
                        <CheckCircleIcon size={14} /> Available
                      </span>
                    ) : (
                      <span className="text-[11px] uppercase tracking-wide text-text-muted">
                        Coming soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
