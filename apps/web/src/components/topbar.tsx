import Image from "next/image";

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.86 17.08a23.85 23.85 0 0 0 5.45-1.31A8.97 8.97 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.97 8.97 0 0 1-2.31 6.02c1.73.64 3.56 1.09 5.45 1.31m5.72 0a24.26 24.26 0 0 1-5.72 0m5.72 0a2.86 2.86 0 0 1-5.72 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Topbar({ userName, userImage }: { userName: string; userImage?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-surface-border px-8 py-4">
      <input
        type="search"
        placeholder="Search anything..."
        className="w-80 rounded-lg border border-surface-border bg-surface px-4 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none"
      />
      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-secondary transition hover:text-white"
        >
          <BellIcon />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-pink" />
        </button>
        <div className="flex items-center gap-2">
          {userImage ? (
            <Image
              src={userImage}
              alt={userName}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary-gradient" />
          )}
          <span className="text-sm font-medium text-white">{userName}</span>
        </div>
      </div>
    </header>
  );
}
