import Image from "next/image";

export function Topbar({ userName, userImage }: { userName: string; userImage?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-surface-border px-8 py-4">
      <input
        type="search"
        placeholder="Search anything..."
        className="w-80 rounded-lg border border-surface-border bg-surface px-4 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none"
      />
      <div className="flex items-center gap-4">
        <button aria-label="Notifications" className="relative text-text-secondary">
          🔔
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-pink" />
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
