import Image from "next/image";
import { BellIcon, MenuIcon } from "./icons";

export function Topbar({
  userName,
  userImage,
  onMenuClick,
}: {
  userName: string;
  userImage?: string;
  onMenuClick: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-surface-border px-4 py-4 md:px-8">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="text-text-secondary hover:text-heading lg:hidden"
      >
        <MenuIcon size={22} />
      </button>

      <input
        type="search"
        placeholder="Search anything..."
        className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface px-4 py-2 text-sm text-heading placeholder:text-text-muted focus:outline-none md:w-80 md:flex-none"
      />
      <div className="flex items-center gap-3 md:gap-4">
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary transition hover:text-heading"
        >
          <BellIcon />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-pink" />
        </button>
        <div className="hidden items-center gap-2 sm:flex">
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
          <span className="text-sm font-medium text-heading">{userName}</span>
        </div>
      </div>
    </header>
  );
}
