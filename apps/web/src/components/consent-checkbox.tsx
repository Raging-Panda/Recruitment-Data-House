"use client";

import Link from "next/link";

/** The POPIA consent tick box, shared by the login card and /consent so the
 * wording people agree to is the same wherever they agree to it. The links
 * open in a new tab so reading the policy doesn't lose the page. */
export function ConsentCheckbox({
  checked,
  onChange,
  showError,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  showError: boolean;
}) {
  return (
    <div className="text-left">
      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-text-secondary">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span>
          I&apos;m 18 or older, I agree to the{" "}
          <Link href="/terms" target="_blank" className="underline hover:text-heading">
            Terms
          </Link>
          , and I consent to IPSkill processing my personal information as the{" "}
          <Link href="/privacy" target="_blank" className="underline hover:text-heading">
            Privacy Policy
          </Link>{" "}
          describes.
        </span>
      </label>
      {showError && (
        <p role="alert" className="mt-1.5 text-xs text-accent-red">
          Tick the box to continue.
        </p>
      )}
    </div>
  );
}
