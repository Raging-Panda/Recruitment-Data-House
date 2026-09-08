import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; filled?: boolean };

function Base({
  size = 18,
  filled: _filled,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <Base {...props}>
        <path
          d="M3 11.5 12 4l9 7.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v6H4.5A1.5 1.5 0 0 1 3 19v-7.5Z"
          fill="currentColor"
          stroke="none"
        />
      </Base>
    );
  }
  return (
    <Base {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </Base>
  );
}

export function PersonIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <Base {...props}>
        <circle cx="12" cy="8" r="3.5" fill="currentColor" stroke="none" />
        <path
          d="M12 12.5c-4.5 0-7.7 2.7-8.8 7a1 1 0 0 0 1 1.3h15.6a1 1 0 0 0 1-1.3c-1.1-4.3-4.3-7-8.8-7Z"
          fill="currentColor"
          stroke="none"
        />
      </Base>
    );
  }
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-3.5 4-5.5 7.5-5.5s6.3 2 7.5 5.5" />
    </Base>
  );
}

export function UsersIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <Base {...props}>
        <circle cx="9" cy="8.5" r="3" fill="currentColor" stroke="none" />
        <path
          d="M9 14.2c-2.8 0-4.9 1.8-5.9 4.8a1 1 0 0 0 .95 1.3h9.9a1 1 0 0 0 .95-1.3c-1-3-3.1-4.8-5.9-4.8Z"
          fill="currentColor"
          stroke="none"
        />
        <circle cx="17" cy="9" r="2.3" fill="currentColor" stroke="none" fillOpacity={0.6} />
        <path
          d="M16 14.5c2.2 0.3 3.8 1.8 4.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.6}
        />
      </Base>
    );
  }
  return (
    <Base {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3 19c0.9-3 3.2-4.8 6-4.8s5.1 1.8 6 4.8" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M16 14.5c2.2 0.3 3.8 1.8 4.5 4.5" />
    </Base>
  );
}

export function CodeIcon({ filled, ...props }: IconProps) {
  return (
    <Base {...props} strokeWidth={filled ? 2.5 : 1.75}>
      <path d="m9 8-4 4 4 4" />
      <path d="m15 8 4 4-4 4" />
    </Base>
  );
}

export function BriefcaseIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <Base {...props}>
        <path
          d="M8.5 8V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v2"
          fill="none"
          stroke="currentColor"
        />
        <rect x="3.5" y="8" width="17" height="11" rx="1.5" fill="currentColor" stroke="none" />
      </Base>
    );
  }
  return (
    <Base {...props}>
      <rect x="3.5" y="8" width="17" height="11" rx="1.5" />
      <path d="M8.5 8V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v2" />
      <path d="M3.5 13h17" />
    </Base>
  );
}

export function LayersIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <Base {...props}>
        <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" fill="currentColor" stroke="none" />
        <path
          d="m3.5 12 8.5 4.5 8.5-4.5"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.55}
        />
        <path
          d="m3.5 16.5 8.5 4.5 8.5-4.5"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.55}
        />
      </Base>
    );
  }
  return (
    <Base {...props}>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
    </Base>
  );
}

export function ShieldCheckIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <Base {...props}>
        <path
          d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z"
          fill="currentColor"
          stroke="none"
        />
      </Base>
    );
  }
  return (
    <Base {...props}>
      <path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z" />
      <path d="m9 12 2 2 4-4.5" />
    </Base>
  );
}

export function StarIcon({ filled, ...props }: IconProps) {
  return (
    <Base {...props} fill={filled ? "currentColor" : "none"}>
      <path d="m12 4 2.3 4.9 5.4.7-3.9 3.8.9 5.4L12 16.3 7.3 18.8l.9-5.4-3.9-3.8 5.4-.7L12 4Z" />
    </Base>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </Base>
  );
}

export function BarChartIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <Base {...props}>
        <rect x="3.8" y="10" width="2.6" height="10" rx="1" fill="currentColor" stroke="none" />
        <rect x="10.7" y="4" width="2.6" height="16" rx="1" fill="currentColor" stroke="none" />
        <rect x="17.6" y="13" width="2.6" height="7" rx="1" fill="currentColor" stroke="none" />
      </Base>
    );
  }
  return (
    <Base {...props}>
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </Base>
  );
}

export function GearIcon({ filled, ...props }: IconProps) {
  return (
    <Base {...props}>
      <circle
        cx="12"
        cy="12"
        r="3"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
      />
      <path d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </Base>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14.86 17.08a23.85 23.85 0 0 0 5.45-1.31A8.97 8.97 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.97 8.97 0 0 1-2.31 6.02c1.73.64 3.56 1.09 5.45 1.31m5.72 0a24.26 24.26 0 0 1-5.72 0m5.72 0a2.86 2.86 0 0 1-5.72 0" />
    </Base>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11.5 4H5a1 1 0 0 0-1 1v6.5a1 1 0 0 0 .3.7l8.5 8.5a1 1 0 0 0 1.4 0l6.5-6.5a1 1 0 0 0 0-1.4l-8.5-8.5a1 1 0 0 0-.7-.3Z" />
      <circle cx="8.5" cy="8.5" r="1.25" />
    </Base>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12h4l2.5-7L14 19l2.5-7H21" />
    </Base>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 12h16" />
      <path d="m13 6 6 6-6 6" />
    </Base>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m5 5 14 14" />
      <path d="m19 5-14 14" />
    </Base>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </Base>
  );
}

export function CircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
    </Base>
  );
}

export function BookmarkIcon({ filled, ...props }: IconProps) {
  return (
    <Base {...props} fill={filled ? "currentColor" : "none"}>
      <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z" />
    </Base>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.35-4.35" />
    </Base>
  );
}
